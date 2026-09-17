"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LOCAL DISK STORAGE PROVIDER (DESARROLLO Y BACKUP LOCAL)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalDiskStorageProvider = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'secret-jwt-key-for-signed-urls';
const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
const DEFAULT_EXPIRATION_SEC = parseInt(process.env.STORAGE_SIGNED_URL_EXPIRATION_SEC || '900', 10); // 15 minutos
class LocalDiskStorageProvider {
    constructor(customBaseDir) {
        this.baseDir = customBaseDir || path_1.default.join(process.cwd(), 'uploads');
        if (!fs_1.default.existsSync(this.baseDir)) {
            fs_1.default.mkdirSync(this.baseDir, { recursive: true });
        }
    }
    async upload(options) {
        const { companyId, applicationId, documentType, originalName, mimeType, buffer, filePath } = options;
        // Crear subdirectorio aislado por empresa y postulación
        const relativeFolder = path_1.default.join('companies', companyId, applicationId);
        const targetFolder = path_1.default.join(this.baseDir, relativeFolder);
        if (!fs_1.default.existsSync(targetFolder)) {
            fs_1.default.mkdirSync(targetFolder, { recursive: true });
        }
        const ext = path_1.default.extname(originalName) || '.bin';
        const uniqueSuffix = `${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}`;
        const cleanDocType = documentType.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        const safeFileName = `${cleanDocType}_${uniqueSuffix}${ext}`;
        const storageKey = path_1.default.join(relativeFolder, safeFileName).replace(/\\/g, '/');
        const targetPath = path_1.default.join(this.baseDir, storageKey);
        let fileBuffer;
        let fileSize;
        if (buffer) {
            fileBuffer = buffer;
            fileSize = buffer.length;
            fs_1.default.writeFileSync(targetPath, fileBuffer);
        }
        else if (filePath && fs_1.default.existsSync(filePath)) {
            fileBuffer = fs_1.default.readFileSync(filePath);
            fileSize = fileBuffer.length;
            // Si el archivo ya está en targetPath no copiar, si no, copiarlo
            if (path_1.default.resolve(filePath) !== path_1.default.resolve(targetPath)) {
                fs_1.default.copyFileSync(filePath, targetPath);
            }
        }
        else {
            throw new Error(`No se proporcionó buffer ni archivo fuente válido para ${originalName}`);
        }
        const fileHash = crypto_1.default.createHash('sha256').update(fileBuffer).digest('hex');
        return {
            storageProvider: 'local',
            storageKey,
            fileName: originalName,
            filePath: targetPath.replace(/\\/g, '/'),
            fileSize,
            mimeType,
            fileHash,
        };
    }
    async getSignedDownloadUrl(storageKey, originalName, expiresInSeconds = DEFAULT_EXPIRATION_SEC) {
        const token = jsonwebtoken_1.default.sign({
            key: storageKey,
            name: originalName,
            type: 'download_ticket',
        }, JWT_SECRET, { expiresIn: expiresInSeconds });
        return `${BASE_URL}/api/recruitment/documents/resolve-signed-url?token=${token}`;
    }
    async getFileStream(storageKey) {
        const fullPath = path_1.default.join(this.baseDir, storageKey);
        if (!fs_1.default.existsSync(fullPath)) {
            throw new Error(`Archivo no encontrado en almacenamiento local: ${storageKey}`);
        }
        const stat = fs_1.default.statSync(fullPath);
        const stream = fs_1.default.createReadStream(fullPath);
        return {
            stream,
            size: stat.size,
            fileName: path_1.default.basename(fullPath),
        };
    }
    async delete(storageKey) {
        try {
            const fullPath = path_1.default.join(this.baseDir, storageKey);
            if (fs_1.default.existsSync(fullPath)) {
                fs_1.default.unlinkSync(fullPath);
                return true;
            }
            return false;
        }
        catch {
            return false;
        }
    }
    async exists(storageKey) {
        const fullPath = path_1.default.join(this.baseDir, storageKey);
        return fs_1.default.existsSync(fullPath);
    }
}
exports.LocalDiskStorageProvider = LocalDiskStorageProvider;
//# sourceMappingURL=local-disk.provider.js.map