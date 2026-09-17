"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STORAGE FACTORY
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStorageProvider = getStorageProvider;
exports.setCustomStorageProvider = setCustomStorageProvider;
const local_disk_provider_1 = require("./local-disk.provider");
const s3_provider_1 = require("./s3.provider");
__exportStar(require("./storage.interface"), exports);
__exportStar(require("./local-disk.provider"), exports);
__exportStar(require("./s3.provider"), exports);
let cachedProvider = null;
function getStorageProvider() {
    if (cachedProvider) {
        return cachedProvider;
    }
    const providerType = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
    if (providerType === 's3' || providerType === 'r2' || providerType === 'minio') {
        cachedProvider = new s3_provider_1.S3StorageProvider();
    }
    else {
        cachedProvider = new local_disk_provider_1.LocalDiskStorageProvider();
    }
    return cachedProvider;
}
function setCustomStorageProvider(provider) {
    cachedProvider = provider;
}
//# sourceMappingURL=index.js.map