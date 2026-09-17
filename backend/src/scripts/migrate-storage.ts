/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SCRIPT DE MIGRACIÓN: LOCAL DISK STORAGE → OBJECT STORAGE (S3 / R2 / MINIO)
 * Security Force P&V S.A.C.
 * Uso: npx ts-node src/scripts/migrate-storage.ts [--dry-run]
 * ═══════════════════════════════════════════════════════════════════════════
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import db from '../db';
import { S3StorageProvider } from '../shared/storage/s3.provider';

dotenv.config();

interface MigrationStats {
  totalRecords: number;
  migrated: number;
  alreadyInS3: number;
  orphaned: number;
  errors: number;
  duplicatesFound: number;
}

async function runStorageMigration(): Promise<void> {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('════════════════════════════════════════════════════════════════');
  console.log(`🚀 INICIANDO MIGRACIÓN DE ALMACENAMIENTO DOCUMENTAL`);
  console.log(`   Modo: ${isDryRun ? 'DRY-RUN (Simulación sin transferir)' : 'EJECUCIÓN REAL'}`);
  console.log(`   Bucket Destino: ${process.env.STORAGE_BUCKET || 'security-force-docs'}`);
  console.log(`   Región/Endpoint: ${process.env.STORAGE_REGION || 'us-east-1'} / ${process.env.STORAGE_ENDPOINT || 'AWS S3 Estándar'}`);
  console.log('════════════════════════════════════════════════════════════════\n');

  const s3Provider = new S3StorageProvider();
  const stats: MigrationStats = {
    totalRecords: 0,
    migrated: 0,
    alreadyInS3: 0,
    orphaned: 0,
    errors: 0,
    duplicatesFound: 0,
  };

  const hashesSeen = new Set<string>();

  try {
    const { rows: docs } = await db.query<{
      id: string;
      company_id: string;
      application_id: string;
      document_type: string;
      file_name: string;
      file_path: string;
      mime_type: string;
      file_size: number;
      file_hash: string;
      storage_provider: string;
      storage_key: string;
    }>(
      `SELECT * FROM application_documents ORDER BY uploaded_at ASC`
    );

    stats.totalRecords = docs.length;
    console.log(`📋 Total de documentos registrados en BD: ${stats.totalRecords}\n`);

    for (const doc of docs) {
      if (doc.storage_provider === 's3' && doc.storage_key) {
        stats.alreadyInS3++;
        continue;
      }

      // Detectar duplicados de hash para reporte de integridad
      if (doc.file_hash) {
        if (hashesSeen.has(doc.file_hash)) {
          stats.duplicatesFound++;
        } else {
          hashesSeen.add(doc.file_hash);
        }
      }

      // Localizar archivo físico en disco
      let localPath = doc.file_path;
      if (!localPath || !fs.existsSync(localPath)) {
        // Intentar resolver relativo a uploads
        if (doc.storage_key) {
          const altPath = path.join(process.cwd(), 'uploads', doc.storage_key);
          if (fs.existsSync(altPath)) {
            localPath = altPath;
          }
        }
      }

      if (!localPath || !fs.existsSync(localPath)) {
        console.warn(`⚠️ [HUÉRFANO] Documento ID ${doc.id} (${doc.file_name}) — Archivo físico no encontrado en disco.`);
        stats.orphaned++;
        continue;
      }

      if (isDryRun) {
        console.log(`[DRY-RUN] Migraría: ${doc.file_name} (${doc.file_size || 0} bytes) -> S3: companies/${doc.company_id}/${doc.application_id}/...`);
        stats.migrated++;
        continue;
      }

      try {
        const fileBuffer = fs.readFileSync(localPath);
        const calculatedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        const uploadResult = await s3Provider.upload({
          companyId: doc.company_id,
          applicationId: doc.application_id,
          documentType: doc.document_type || 'documento',
          originalName: doc.file_name,
          mimeType: doc.mime_type || 'application/octet-stream',
          buffer: fileBuffer,
        });

        // Actualizar registro en BD sin borrar el archivo local
        await db.query(
          `UPDATE application_documents
           SET storage_provider = 's3',
               storage_key = $1,
               file_hash = COALESCE(file_hash, $2),
               original_name = COALESCE(original_name, $3)
           WHERE id = $4`,
          [uploadResult.storageKey, calculatedHash, doc.file_name, doc.id]
        );

        stats.migrated++;
        console.log(`✅ [MIGRADO] ID ${doc.id} -> ${uploadResult.storageKey}`);
      } catch (err: any) {
        console.error(`❌ [ERROR] Falló migración de ID ${doc.id}:`, err.message);
        stats.errors++;
      }
    }

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('📊 REPORTE FINAL DE MIGRACIÓN:');
    console.log(`   Total analizados:       ${stats.totalRecords}`);
    console.log(`   Ya en S3/ObjectStorage: ${stats.alreadyInS3}`);
    console.log(`   Migrados con éxito:     ${stats.migrated}`);
    console.log(`   Huérfanos en disco:     ${stats.orphaned}`);
    console.log(`   Duplicados de hash:     ${stats.duplicatesFound}`);
    console.log(`   Errores:                ${stats.errors}`);
    console.log('════════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('Error fatal durante la migración:', err);
  }
}

runStorageMigration().catch(console.error);
