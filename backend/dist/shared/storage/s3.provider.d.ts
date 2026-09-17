/**
 * ═══════════════════════════════════════════════════════════════════════════
 * S3 / OBJECT STORAGE PROVIDER (PRODUCCIÓN: AWS S3, CLOUDFLARE R2, MINIO)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { StorageProvider, UploadFileOptions, UploadResult, StreamResult } from './storage.interface';
export declare class S3StorageProvider implements StorageProvider {
    private s3;
    private bucket;
    private defaultExpirationSec;
    constructor(options?: {
        bucket?: string;
        region?: string;
        endpoint?: string;
        accessKeyId?: string;
        secretAccessKey?: string;
        forcePathStyle?: boolean;
        defaultExpirationSec?: number;
    });
    upload(options: UploadFileOptions): Promise<UploadResult>;
    getSignedDownloadUrl(storageKey: string, originalName?: string, expiresInSeconds?: number): Promise<string>;
    getFileStream(storageKey: string): Promise<StreamResult>;
    delete(storageKey: string): Promise<boolean>;
    exists(storageKey: string): Promise<boolean>;
}
//# sourceMappingURL=s3.provider.d.ts.map