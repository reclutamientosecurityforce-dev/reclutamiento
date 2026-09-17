/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STORAGE FACTORY
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { StorageProvider } from './storage.interface';
export * from './storage.interface';
export * from './local-disk.provider';
export * from './s3.provider';
export declare function getStorageProvider(): StorageProvider;
export declare function setCustomStorageProvider(provider: StorageProvider): void;
//# sourceMappingURL=index.d.ts.map