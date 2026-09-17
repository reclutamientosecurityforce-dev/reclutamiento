/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTROLADOR PÚBLICO DE EXPEDIENTE DIGITAL (Fase 2.9.3)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Request, Response } from 'express';
import db from '../../../../../db';
import { DocumentRequirementsService } from '../../../domain/services/document-requirements.service';
import { getStorageProvider } from '../../../../../shared/storage';
import crypto from 'crypto';

/**
 * GET /public/openings/:openingId/document-requirements
 * Obtiene los requisitos documentales configurados para una convocatoria (público)
 */
export async function getPublicOpeningDocumentRequirements(req: Request, res: Response): Promise<void> {
  try {
    const openingId = req.params.id || req.params.openingId;

    if (!openingId) {
      res.status(400).json({ error: 'ID de convocatoria requerido' });
      return;
    }

    const companyId = req.headers['x-company-id'] as string || undefined;

    const requirements = await DocumentRequirementsService.getOpeningDocumentRequirements(
      openingId,
      companyId && companyId !== 'default' ? companyId : undefined
    );

    res.json(requirements);
  } catch (err) {
    console.error('Error en getPublicOpeningDocumentRequirements:', err);
    res.status(500).json({ error: 'Error al obtener requisitos documentales' });
  }
}

/**
 * GET /public/apply/:draftToken/expediente-status
 * Obtiene el estado del expediente de una postulación (público)
 */
export async function getPublicExpedienteStatus(req: Request, res: Response): Promise<void> {
  try {
    const { draftToken } = req.params;

    // Obtener application_id desde draft_token
    const appResult = await db.query(
      `SELECT id, company_id FROM applications WHERE draft_token = $1`,
      [draftToken]
    );

    if (appResult.rows.length === 0) {
      res.status(404).json({ error: 'Postulación no encontrada' });
      return;
    }

    const { id: applicationId, company_id: companyId } = appResult.rows[0];

    const status = await DocumentRequirementsService.getExpedienteStatus(
      applicationId,
      companyId
    );

    if (!status) {
      res.status(404).json({ error: 'Expediente no encontrado' });
      return;
    }

    res.json(status);
  } catch (err) {
    console.error('Error en getPublicExpedienteStatus:', err);
    res.status(500).json({ error: 'Error al obtener estado del expediente' });
  }
}

/**
 * POST /public/apply/:draftToken/upload-document
 * Sube un documento al expediente digital con clasificación automática
 */
export async function uploadDocumentWithClassification(req: Request, res: Response): Promise<void> {
  try {
    const { draftToken } = req.params;
    const { documentType, documentCategory, requirementId } = req.body;

    if (!req.file) {
      res.status(400).json({ error: 'No se proporcionó ningún archivo' });
      return;
    }

    // Obtener application_id desde draft_token
    const appResult = await db.query(
      `SELECT id, company_id FROM applications WHERE draft_token = $1`,
      [draftToken]
    );

    if (appResult.rows.length === 0) {
      res.status(404).json({ error: 'Postulación no encontrada' });
      return;
    }

    const { id: applicationId, company_id: companyId } = appResult.rows[0];

    // Calcular hash SHA-256 del archivo
    const fileBuffer = req.file.buffer;
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Clasificación automática del documento
    const classification = await classifyDocument(req.file, documentType, documentCategory);

    // Guardar archivo usando StorageProvider
    const storageProvider = getStorageProvider();
    const storageKey = `documents/${companyId}/${applicationId}/${Date.now()}_${req.file.originalname}`;
    
    await storageProvider.upload({
      companyId,
      applicationId,
      documentType: documentType || classification.suggestedType,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      buffer: fileBuffer,
      fileSize: req.file.size,
    });

    // Insertar documento en application_documents
    const docResult = await db.query(
      `INSERT INTO application_documents (
        company_id, application_id, document_type, file_name, file_path,
        mime_type, file_size, storage_provider, storage_key, file_hash,
        document_category, document_type_typed, requirement_id,
        verification_status, classification_confidence, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        companyId,
        applicationId,
        documentType || classification.suggestedType,
        req.file.originalname,
        storageKey,
        req.file.mimetype,
        req.file.size,
        storageProvider.constructor.name === 'S3Provider' ? 's3' : 'local',
        storageKey,
        fileHash,
        classification.suggestedCategory,
        classification.suggestedType,
        requirementId || null,
        'pending',
        classification.confidence,
        JSON.stringify({
          classificationMethod: classification.method,
          uploadedAt: new Date().toISOString(),
        }),
      ]
    );

    // Registrar clasificación si fue automática
    if (classification.method === 'ai' && classification.confidence > 0.7) {
      await db.query(
        `INSERT INTO document_classifications (
          company_id, document_id, suggested_type, suggested_category,
          confidence_score, classification_method, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          companyId,
          docResult.rows[0].id,
          classification.suggestedType,
          classification.suggestedCategory,
          classification.confidence,
          'ai',
          JSON.stringify({ originalFilename: req.file.originalname }),
        ]
      );
    }

    res.status(201).json({
      document: docResult.rows[0],
      classification: classification.confidence > 0.7 ? {
        suggestedType: classification.suggestedType,
        suggestedCategory: classification.suggestedCategory,
        confidence: classification.confidence,
        needsConfirmation: classification.confidence < 0.9,
      } : null,
    });
  } catch (err) {
    console.error('Error en uploadDocumentWithClassification:', err);
    res.status(500).json({ error: 'Error al subir documento' });
  }
}

/**
 * PUT /public/apply/:draftToken/documents/:documentId/confirm-classification
 * Confirma o corrige la clasificación de un documento
 */
export async function confirmDocumentClassification(req: Request, res: Response): Promise<void> {
  try {
    const { draftToken, documentId } = req.params;
    const { confirmedType, confirmedCategory } = req.body;

    // Verificar que el documento pertenece a la postulación
    const appResult = await db.query(
      `SELECT ad.id, ad.company_id 
       FROM application_documents ad
       JOIN applications a ON ad.application_id = a.id
       WHERE ad.id = $1 AND a.draft_token = $2`,
      [documentId, draftToken]
    );

    if (appResult.rows.length === 0) {
      res.status(404).json({ error: 'Documento no encontrado' });
      return;
    }

    const { id, company_id: companyId } = appResult.rows[0];

    // Actualizar documento con clasificación confirmada
    await db.query(
      `UPDATE application_documents
       SET document_type_typed = $1, document_category = $2, verification_status = 'pending'
       WHERE id = $3`,
      [confirmedType, confirmedCategory, id]
    );

    // Actualizar o crear registro de clasificación
    await db.query(
      `INSERT INTO document_classifications (
        company_id, document_id, confirmed_type, confirmed_category,
        confirmed_at, classification_method
      ) VALUES ($1, $2, $3, $4, NOW(), 'user')
      ON CONFLICT (document_id) 
      DO UPDATE SET 
        confirmed_type = $3,
        confirmed_category = $4,
        confirmed_at = NOW(),
        classification_method = 'user'`,
      [companyId, id, confirmedType, confirmedCategory]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error en confirmDocumentClassification:', err);
    res.status(500).json({ error: 'Error al confirmar clasificación' });
  }
}

/**
 * GET /public/apply/:draftToken/documents
 * Obtiene los documentos del expediente de una postulación
 */
export async function getApplicationDocuments(req: Request, res: Response): Promise<void> {
  try {
    const { draftToken } = req.params;

    const result = await db.query(
      `SELECT ad.*, odr.title as requirement_title, odr.is_required
       FROM application_documents ad
       LEFT JOIN opening_document_requirements odr ON ad.requirement_id = odr.id
       JOIN applications a ON ad.application_id = a.id
       WHERE a.draft_token = $1
       ORDER BY ad.uploaded_at DESC`,
      [draftToken]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error en getApplicationDocuments:', err);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
}

/**
 * DELETE /public/apply/:draftToken/documents/:documentId
 * Elimina un documento del expediente
 */
export async function deleteApplicationDocument(req: Request, res: Response): Promise<void> {
  try {
    const { draftToken, documentId } = req.params;

    // Verificar que el documento pertenece a la postulación
    const appResult = await db.query(
      `SELECT ad.id, ad.storage_key, ad.company_id 
       FROM application_documents ad
       JOIN applications a ON ad.application_id = a.id
       WHERE ad.id = $1 AND a.draft_token = $2`,
      [documentId, draftToken]
    );

    if (appResult.rows.length === 0) {
      res.status(404).json({ error: 'Documento no encontrado' });
      return;
    }

    const { id, storage_key: storageKey, company_id: companyId } = appResult.rows[0];

    // Eliminar archivo del storage
    const storageProvider = getStorageProvider();
    await storageProvider.delete(storageKey);

    // Eliminar registro de la base de datos
    await db.query(
      `DELETE FROM application_documents WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );

    res.status(204).send();
  } catch (err) {
    console.error('Error en deleteApplicationDocument:', err);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
}

/**
 * Función auxiliar para clasificar documentos automáticamente
 */
async function classifyDocument(
  file: Express.Multer.File,
  providedType?: string,
  providedCategory?: string
): Promise<{
  suggestedType: string;
  suggestedCategory: string;
  confidence: number;
  method: 'ai' | 'manual' | 'user';
}> {
  // Si el usuario proporcionó el tipo, usarlo con alta confianza
  if (providedType && providedCategory) {
    return {
      suggestedType: providedType,
      suggestedCategory: providedCategory,
      confidence: 1.0,
      method: 'user',
    };
  }

  // Clasificación básica basada en nombre de archivo y tipo MIME
  const filename = file.originalname.toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  // Análisis simple de contenido del nombre de archivo
  let suggestedType = 'OTRO';
  let suggestedCategory = 'OTROS';
  let confidence = 0.5;

  // Patrones de clasificación
  const patterns = [
    { type: 'DNI', category: 'IDENTIDAD', patterns: ['dni', 'identidad', 'documento'], confidence: 0.8 },
    { type: 'CE', category: 'IDENTIDAD', patterns: ['carnet extranjeria', 'ce', 'extranjer'], confidence: 0.8 },
    { type: 'CUL', category: 'IDENTIDAD', patterns: ['cul', 'certificado laboral', 'trabajo'], confidence: 0.7 },
    { type: 'SUCAMEC', category: 'SEGURIDAD', patterns: ['sucamec', 'seguridad', 'carnet'], confidence: 0.9 },
    { type: 'LICENCIA_ARMAS', category: 'LICENCIAS', patterns: ['licencia arma', 'arma', 'pfa'], confidence: 0.85 },
    { type: 'BREVETE', category: 'LICENCIAS', patterns: ['brevete', 'licencia conducir', 'conducir'], confidence: 0.85 },
    { type: 'CERTIFICADO_ESTUDIOS', category: 'FORMACION_ACADEMICA', patterns: ['estudio', 'secundaria', 'bachiller'], confidence: 0.75 },
    { type: 'CERTIFICADO_EXPERIENCIA', category: 'EXPERIENCIA_LABORAL', patterns: ['experiencia', 'trabajo', 'laboral', 'certificado'], confidence: 0.7 },
    { type: 'PRIMEROS_AUXILIOS', category: 'CAPACITACION', patterns: ['primeros auxilios', 'auxilios', 'salud'], confidence: 0.8 },
    { type: 'CCTV', category: 'CAPACITACION', patterns: ['cctv', 'camara', 'video'], confidence: 0.8 },
    { type: 'SST', category: 'CAPACITACION', patterns: ['sst', 'seguridad trabajo', 'salud'], confidence: 0.8 },
  ];

  // Buscar coincidencias
  for (const pattern of patterns) {
    for (const patternStr of pattern.patterns) {
      if (filename.includes(patternStr)) {
        suggestedType = pattern.type;
        suggestedCategory = pattern.category;
        confidence = pattern.confidence;
        break;
      }
    }
    if (confidence > 0.7) break;
  }

  return {
    suggestedType,
    suggestedCategory,
    confidence,
    method: 'ai',
  };
}