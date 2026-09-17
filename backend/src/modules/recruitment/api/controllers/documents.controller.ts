/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTROLADOR DE SEGURIDAD DOCUMENTAL Y DESCARGA CON ACL (Fase 2.7.1)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import db from '../../../../db';
import { ApplicationDocument } from '../../../../types';
import { getStorageProvider } from '../../../../shared/storage';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-jwt-key-for-signed-urls';

/**
 * GET /api/recruitment/documents/:id/download
 * Descarga segura y controlada con verificación estricta de tenant (company_id) y ACL.
 */
export async function downloadDocument(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const companyId = user.companyId;
    const { id: documentId } = req.params;

    // 1. Verificación estricta de aislamiento multi-tenant
    const docRes = await db.query<ApplicationDocument & { applicant_code?: string; candidate_name?: string }>(
      `SELECT 
         ad.*,
         a.application_code AS applicant_code,
         CONCAT(c.first_name, ' ', c.last_name) AS candidate_name
       FROM application_documents ad
       JOIN applications a ON ad.application_id = a.id
       JOIN candidates c ON a.candidate_id = c.id
       WHERE ad.id = $1 AND ad.company_id = $2`,
      [documentId, companyId]
    );

    if (docRes.rows.length === 0) {
      // Registrar intento no autorizado en auditoría si el documento existe en otra empresa
      const crossTenantCheck = await db.query(
        `SELECT company_id FROM application_documents WHERE id = $1`,
        [documentId]
      );

      if (crossTenantCheck.rows.length > 0) {
        await db.query(
          `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
           VALUES ($1, $2, 'cross_tenant_access_denied', 'application_documents', $3, $4)`,
          [
            companyId,
            user.id,
            documentId,
            JSON.stringify({
              attemptedDocId: documentId,
              targetCompanyId: crossTenantCheck.rows[0].company_id,
              userCompanyId: companyId,
              ip: req.ip,
            }),
          ]
        );
        res.status(403).json({ error: 'Acceso denegado: el documento pertenece a otra organización.' });
        return;
      }

      res.status(404).json({ error: 'Documento no encontrado.' });
      return;
    }

    const doc = docRes.rows[0];

    // 2. Registro de auditoría de acceso documental
    await db.query(
      `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
       VALUES ($1, $2, 'document_download_accessed', 'application_documents', $3, $4)`,
      [
        companyId,
        user.id,
        documentId,
        JSON.stringify({
          documentType: doc.document_type,
          fileName: doc.file_name,
          applicantCode: doc.applicant_code,
          fileHash: doc.file_hash,
        }),
      ]
    );

    // 3. Emisión de descarga según proveedor
    const storageProvider = getStorageProvider();
    const storageKey = doc.storage_key || (doc.file_path ? path.relative(path.join(process.cwd(), 'uploads'), doc.file_path).replace(/\\/g, '/') : '');

    if (!storageKey) {
      // Fallback a ruta local legacy si existe
      if (doc.file_path && fs.existsSync(doc.file_path)) {
        res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.file_name)}"`);
        const stream = fs.createReadStream(doc.file_path);
        stream.pipe(res);
        return;
      }
      res.status(404).json({ error: 'El archivo físico no se encuentra disponible.' });
      return;
    }

    // Si es S3/R2/MinIO, generar presigned URL y redirigir
    if (doc.storage_provider === 's3') {
      const signedUrl = await storageProvider.getSignedDownloadUrl(storageKey, doc.file_name);
      res.redirect(signedUrl);
      return;
    }

    // Para almacenamiento local, transmitir el stream autenticado
    try {
      const { stream, mimeType, size } = await storageProvider.getFileStream(storageKey);
      res.setHeader('Content-Type', mimeType || doc.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file_name)}"`);
      if (size) {
        res.setHeader('Content-Length', size);
      }
      stream.pipe(res);
    } catch {
      // Si falla por ruta relativa, intentar ruta absoluta
      if (doc.file_path && fs.existsSync(doc.file_path)) {
        res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file_name)}"`);
        fs.createReadStream(doc.file_path).pipe(res);
        return;
      }
      res.status(404).json({ error: 'Archivo físico no disponible en el almacenamiento.' });
    }
  } catch (err) {
    console.error('Error en downloadDocument:', err);
    res.status(500).json({ error: 'Error al procesar la descarga del documento.' });
  }
}

/**
 * GET /api/recruitment/documents/:id/signed-url
 * Genera una URL firmada con tiempo de expiración configurable para el visor seguro.
 */
export async function getSignedDocumentUrl(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { id: documentId } = req.params;
    const expiresInSec = parseInt((req.query.expiresIn as string) || '900', 10); // 15 min default

    const docRes = await db.query<ApplicationDocument>(
      `SELECT * FROM application_documents WHERE id = $1 AND company_id = $2`,
      [documentId, companyId]
    );

    if (docRes.rows.length === 0) {
      res.status(404).json({ error: 'Documento no encontrado o no pertenece a su organización.' });
      return;
    }

    const doc = docRes.rows[0];
    const storageProvider = getStorageProvider();
    const storageKey = doc.storage_key || (doc.file_path ? path.relative(path.join(process.cwd(), 'uploads'), doc.file_path).replace(/\\/g, '/') : '');

    const signedUrl = await storageProvider.getSignedDownloadUrl(storageKey, doc.file_name, expiresInSec);

    res.json({
      documentId: doc.id,
      fileName: doc.file_name,
      documentType: doc.document_type,
      storageProvider: doc.storage_provider || 'local',
      signedUrl,
      expiresInSeconds: expiresInSec,
      fileHash: doc.file_hash,
    });
  } catch (err) {
    console.error('Error en getSignedDocumentUrl:', err);
    res.status(500).json({ error: 'Error al generar enlace seguro de descarga.' });
  }
}

/**
 * GET /api/recruitment/documents/resolve-signed-url?token=...
 * Endpoint público efímero que valida el token firmado emitido por LocalDiskProvider.
 */
export async function resolveSignedUrl(req: Request, res: Response): Promise<void> {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(401).json({ error: 'Token de descarga no proporcionado.' });
      return;
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      res.status(403).json({ error: 'El enlace de descarga ha expirado o es inválido.' });
      return;
    }

    if (payload.type !== 'download_ticket' || !payload.key) {
      res.status(403).json({ error: 'Ticket de descarga no válido.' });
      return;
    }

    const storageProvider = getStorageProvider();
    const { stream, mimeType, size } = await storageProvider.getFileStream(payload.key);

    res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(payload.name || 'documento')}"`);
    if (size) {
      res.setHeader('Content-Length', size);
    }

    stream.pipe(res);
  } catch (err) {
    console.error('Error en resolveSignedUrl:', err);
    res.status(404).json({ error: 'Archivo no encontrado o expirado.' });
  }
}
