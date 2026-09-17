/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LOCAL DISK STORAGE PROVIDER (DESARROLLO Y BACKUP LOCAL)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Readable } from 'stream';
import { StorageProvider, UploadFileOptions, UploadResult, StreamResult } from './storage.interface';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-jwt-key-for-signed-urls';
const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
const DEFAULT_EXPIRATION_SEC = parseInt(process.env.STORAGE_SIGNED_URL_EXPIRATION_SEC || '900', 10); // 15 minutos

export class LocalDiskStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  public async upload(options: UploadFileOptions): Promise<UploadResult> {
    const { companyId, applicationId, documentType, originalName, mimeType, buffer, filePath } = options;

    // Crear subdirectorio aislado por empresa y postulación
    const relativeFolder = path.join('companies', companyId, applicationId);
    const targetFolder = path.join(this.baseDir, relativeFolder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const ext = path.extname(originalName) || '.bin';
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const cleanDocType = documentType.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const safeFileName = `${cleanDocType}_${uniqueSuffix}${ext}`;
    const storageKey = path.join(relativeFolder, safeFileName).replace(/\\/g, '/');
    const targetPath = path.join(this.baseDir, storageKey);

    let fileBuffer: Buffer;
    let fileSize: number;

    if (buffer) {
      fileBuffer = buffer;
      fileSize = buffer.length;
      fs.writeFileSync(targetPath, fileBuffer);
    } else if (filePath && fs.existsSync(filePath)) {
      fileBuffer = fs.readFileSync(filePath);
      fileSize = fileBuffer.length;
      // Si el archivo ya está en targetPath no copiar, si no, copiarlo
      if (path.resolve(filePath) !== path.resolve(targetPath)) {
        fs.copyFileSync(filePath, targetPath);
      }
    } else {
      throw new Error(`No se proporcionó buffer ni archivo fuente válido para ${originalName}`);
    }

    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

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

  public async getSignedDownloadUrl(storageKey: string, originalName?: string, expiresInSeconds = DEFAULT_EXPIRATION_SEC): Promise<string> {
    const token = jwt.sign(
      {
        key: storageKey,
        name: originalName,
        type: 'download_ticket',
      },
      JWT_SECRET,
      { expiresIn: expiresInSeconds }
    );

    return `${BASE_URL}/api/recruitment/documents/resolve-signed-url?token=${token}`;
  }

  public async getFileStream(storageKey: string): Promise<StreamResult> {
    const fullPath = path.join(this.baseDir, storageKey);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Archivo no encontrado en almacenamiento local: ${storageKey}`);
    }

    const stat = fs.statSync(fullPath);
    const stream = fs.createReadStream(fullPath);

    return {
      stream,
      size: stat.size,
      fileName: path.basename(fullPath),
    };
  }

  public async delete(storageKey: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.baseDir, storageKey);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public async exists(storageKey: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, storageKey);
    return fs.existsSync(fullPath);
  }
}
