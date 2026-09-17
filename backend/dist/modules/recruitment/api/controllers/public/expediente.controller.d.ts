/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTROLADOR PÚBLICO DE EXPEDIENTE DIGITAL (Fase 2.9.3)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { Request, Response } from 'express';
/**
 * GET /public/openings/:openingId/document-requirements
 * Obtiene los requisitos documentales configurados para una convocatoria (público)
 */
export declare function getPublicOpeningDocumentRequirements(req: Request, res: Response): Promise<void>;
/**
 * GET /public/apply/:draftToken/expediente-status
 * Obtiene el estado del expediente de una postulación (público)
 */
export declare function getPublicExpedienteStatus(req: Request, res: Response): Promise<void>;
/**
 * POST /public/apply/:draftToken/upload-document
 * Sube un documento al expediente digital con clasificación automática
 */
export declare function uploadDocumentWithClassification(req: Request, res: Response): Promise<void>;
/**
 * PUT /public/apply/:draftToken/documents/:documentId/confirm-classification
 * Confirma o corrige la clasificación de un documento
 */
export declare function confirmDocumentClassification(req: Request, res: Response): Promise<void>;
/**
 * GET /public/apply/:draftToken/documents
 * Obtiene los documentos del expediente de una postulación
 */
export declare function getApplicationDocuments(req: Request, res: Response): Promise<void>;
/**
 * DELETE /public/apply/:draftToken/documents/:documentId
 * Elimina un documento del expediente
 */
export declare function deleteApplicationDocument(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=expediente.controller.d.ts.map