/**
 * ═══════════════════════════════════════════════════════════════════════════
 * S3 / OBJECT STORAGE PROVIDER (PRODUCCIÓN: AWS S3, CLOUDFLARE R2, MINIO)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider, UploadFileOptions, UploadResult, StreamResult } from './storage.interface';

export class S3StorageProvider implements StorageProvider {
  private s3: S3Client;
  private bucket: string;
  private defaultExpirationSec: number;

  constructor(options?: {
    bucket?: string;
    region?: string;
    endpoint?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    forcePathStyle?: boolean;
    defaultExpirationSec?: number;
  }) {
    this.bucket = options?.bucket || process.env.STORAGE_BUCKET || 'security-force-docs';
    const region = options?.region || process.env.STORAGE_REGION || 'us-east-1';
    const endpoint = options?.endpoint || process.env.STORAGE_ENDPOINT;
    const accessKeyId = options?.accessKeyId || process.env.STORAGE_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '';
    const secretAccessKey = options?.secretAccessKey || process.env.STORAGE_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '';
    const forcePathStyle = options?.forcePathStyle !== undefined
      ? options.forcePathStyle
      : (process.env.STORAGE_FORCE_PATH_STYLE === 'true' || !!endpoint); // true para MinIO

    this.defaultExpirationSec = options?.defaultExpirationSec || parseInt(process.env.STORAGE_SIGNED_URL_EXPIRATION_SEC || '900', 10);

    const clientConfig: any = {
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

    this.s3 = new S3Client(clientConfig);
  }

  public async upload(options: UploadFileOptions): Promise<UploadResult> {
    const { companyId, applicationId, documentType, originalName, mimeType, buffer, filePath } = options;

    let fileBuffer: Buffer;
    let fileSize: number;

    if (buffer) {
      fileBuffer = buffer;
      fileSize = buffer.length;
    } else if (filePath && fs.existsSync(filePath)) {
      fileBuffer = fs.readFileSync(filePath);
      fileSize = fileBuffer.length;
    } else {
      throw new Error(`No se proporcionó buffer ni archivo fuente válido para ${originalName}`);
    }

    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const ext = path.extname(originalName) || '.bin';
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const cleanDocType = documentType.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const storageKey = `companies/${companyId}/${applicationId}/${cleanDocType}_${uniqueSuffix}${ext}`;

    const command = new PutObjectCommand({
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

  public async getSignedDownloadUrl(
    storageKey: string,
    originalName?: string,
    expiresInSeconds = this.defaultExpirationSec
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ResponseContentDisposition: originalName ? `attachment; filename="${encodeURIComponent(originalName)}"` : undefined,
    });

    return await getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  public async getFileStream(storageKey: string): Promise<StreamResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });

    const response = await this.s3.send(command);
    if (!response.Body) {
      throw new Error(`El objeto en S3 no contiene cuerpo de respuesta: ${storageKey}`);
    }

    return {
      stream: response.Body as Readable,
      mimeType: response.ContentType,
      size: response.ContentLength,
      fileName: path.basename(storageKey),
    };
  }

  public async delete(storageKey: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      });
      await this.s3.send(command);
      return true;
    } catch {
      return false;
    }
  }

  public async exists(storageKey: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      });
      await this.s3.send(command);
      return true;
    } catch {
      return false;
    }
  }
}
