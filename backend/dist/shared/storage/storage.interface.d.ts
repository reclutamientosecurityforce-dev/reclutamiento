/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTRATO DE ALMACENAMIENTO (OBJECT STORAGE / LOCAL DISK)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { Readable } from 'stream';
export interface UploadFileOptions {
    companyId: string;
    applicationId: string;
    documentType: string;
    originalName: string;
    mimeType: string;
    buffer?: Buffer;
    filePath?: string;
    fileSize?: number;
}
export interface UploadResult {
    storageProvider: 'local' | 's3';
    storageKey: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    fileHash: string;
}
export interface StreamResult {
    stream: Readable;
    mimeType?: string;
    size?: number;
    fileName?: string;
}
export interface StorageProvider {
    /**
     * Sube un archivo al almacenamiento configurado y calcula su hash SHA-256.
     */
    upload(options: UploadFileOptions): Promise<UploadResult>;
    /**
     * Genera una URL firmada y temporal para descarga segura sin exponer credenciales.
     */
    getSignedDownloadUrl(storageKey: string, originalName?: string, expiresInSeconds?: number): Promise<string>;
    /**
     * Obtiene un stream binario de lectura autenticado para el archivo.
     */
    getFileStream(storageKey: string): Promise<StreamResult>;
    /**
     * Elimina un archivo del almacenamiento.
     */
    delete(storageKey: string): Promise<boolean>;
    /**
     * Verifica la existencia física del archivo.
     */
    exists(storageKey: string): Promise<boolean>;
}
//# sourceMappingURL=storage.interface.d.ts.map