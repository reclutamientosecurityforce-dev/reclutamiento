/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STORAGE FACTORY
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { StorageProvider } from './storage.interface';
import { LocalDiskStorageProvider } from './local-disk.provider';
import { S3StorageProvider } from './s3.provider';

export * from './storage.interface';
export * from './local-disk.provider';
export * from './s3.provider';

let cachedProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const providerType = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

  if (providerType === 's3' || providerType === 'r2' || providerType === 'minio') {
    cachedProvider = new S3StorageProvider();
  } else {
    cachedProvider = new LocalDiskStorageProvider();
  }

  return cachedProvider;
}

export function setCustomStorageProvider(provider: StorageProvider): void {
  cachedProvider = provider;
}
