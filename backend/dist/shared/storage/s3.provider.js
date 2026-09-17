"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * S3 / OBJECT STORAGE PROVIDER (PRODUCCIÓN: AWS S3, CLOUDFLARE R2, MINIO)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageProvider = void 0;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3StorageProvider {
    constructor(options) {
        this.bucket = options?.bucket || process.env.STORAGE_BUCKET || 'security-force-docs';
        const region = options?.region || process.env.STORAGE_REGION || 'us-east-1';
        const endpoint = options?.endpoint || process.env.STORAGE_ENDPOINT;
        const accessKeyId = options?.accessKeyId || process.env.STORAGE_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '';
        const secretAccessKey = options?.secretAccessKey || process.env.STORAGE_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '';
        const forcePathStyle = options?.forcePathStyle !== undefined
            ? options.forcePathStyle
            : (process.env.STORAGE_FORCE_PATH_STYLE === 'true' || !!endpoint); // true para MinIO
        this.defaultExpirationSec = options?.defaultExpirationSec || parseInt(process.env.STORAGE_SIGNED_URL_EXPIRATION_SEC || '900', 10);
        const clientConfig = {
            region,
            forcePathStyle,
        };
        if (endpoint) {
            clientConfig.endpoint = endpoint;
        }
        if (accessKeyId && secretAccessKey) {
            clientConfig.credentials = {
                accessKeyId,
                secretAccessKey,
            };
        }
        this.s3 = new client_s3_1.S3Client(clientConfig);
    }
    async upload(options) {
        const { companyId, applicationId, documentType, originalName, mimeType, buffer, filePath } = options;
        let fileBuffer;
        let fileSize;
        if (buffer) {
            fileBuffer = buffer;
            fileSize = buffer.length;
        }
        else if (filePath && fs_1.default.existsSync(filePath)) {
            fileBuffer = fs_1.default.readFileSync(filePath);
            fileSize = fileBuffer.length;
        }
        else {
            throw new Error(`No se proporcionó buffer ni archivo fuente válido para ${originalName}`);
        }
        const fileHash = crypto_1.default.createHash('sha256').update(fileBuffer).digest('hex');
        const ext = path_1.default.extname(originalName) || '.bin';
        const uniqueSuffix = `${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}`;
        const cleanDocType = documentType.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        const storageKey = `companies/${companyId}/${applicationId}/${cleanDocType}_${uniqueSuffix}${ext}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: storageKey,
            Body: fileBuffer,
            ContentType: mimeType,
            Metadata: {
                'original-name': encodeURIComponent(originalName),
                'file-hash': fileHash,
                'company-id': companyId,
                'application-id': applicationId,
            },
        });
        await this.s3.send(command);
        return {
            storageProvider: 's3',
            storageKey,
            fileName: originalName,
            filePath: `s3://${this.bucket}/${storageKey}`,
            fileSize,
            mimeType,
            fileHash,
        };
    }
    async getSignedDownloadUrl(storageKey, originalName, expiresInSeconds = this.defaultExpirationSec) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: storageKey,
            ResponseContentDisposition: originalName ? `attachment; filename="${encodeURIComponent(originalName)}"` : undefined,
        });
        return await (0, s3_request_presigner_1.getSignedUrl)(this.s3, command, { expiresIn: expiresInSeconds });
    }
    async getFileStream(storageKey) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: storageKey,
        });
        const response = await this.s3.send(command);
        if (!response.Body) {
            throw new Error(`El objeto en S3 no contiene cuerpo de respuesta: ${storageKey}`);
        }
        return {
            stream: response.Body,
            mimeType: response.ContentType,
            size: response.ContentLength,
            fileName: path_1.default.basename(storageKey),
        };
    }
    async delete(storageKey) {
        try {
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucket,
                Key: storageKey,
            });
            await this.s3.send(command);
            return true;
        }
        catch {
            return false;
        }
    }
    async exists(storageKey) {
        try {
            const command = new client_s3_1.HeadObjectCommand({
                Bucket: this.bucket,
                Key: storageKey,
            });
            await this.s3.send(command);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.S3StorageProvider = S3StorageProvider;
//# sourceMappingURL=s3.provider.js.map