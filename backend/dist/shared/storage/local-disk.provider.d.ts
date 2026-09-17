/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LOCAL DISK STORAGE PROVIDER (DESARROLLO Y BACKUP LOCAL)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { StorageProvider, UploadFileOptions, UploadResult, StreamResult } from './storage.interface';
export declare class LocalDiskStorageProvider implements StorageProvider {
    private baseDir;
    constructor(customBaseDir?: string);
    upload(options: UploadFileOptions): Promise<UploadResult>;
    getSignedDownloadUrl(storageKey: string, originalName?: string, expiresInSeconds?: number): Promise<string>;
    getFileStream(storageKey: string): Promise<StreamResult>;
    delete(storageKey: string): Promise<boolean>;
    exists(storageKey: string): Promise<boolean>;
}
//# sourceMappingURL=local-disk.provider.d.ts.map