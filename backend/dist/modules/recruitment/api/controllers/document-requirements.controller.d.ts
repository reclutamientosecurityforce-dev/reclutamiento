/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTROLADOR DE REQUISITOS DOCUMENTALES (Fase 2.9.3)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { Request, Response } from 'express';
/**
 * GET /api/recruitment/openings/:openingId/document-requirements
 * Obtiene los requisitos documentales configurados para una convocatoria
 */
export declare function getOpeningDocumentRequirements(req: Request, res: Response): Promise<void>;
/**
 * POST /api/recruitment/openings/:openingId/document-requirements
 * Crea un nuevo requisito documental para una convocatoria
 */
export declare function createOpeningDocumentRequirement(req: Request, res: Response): Promise<void>;
/**
 * PUT /api/recruitment/document-requirements/:id
 * Actualiza un requisito documental existente
 */
export declare function updateOpeningDocumentRequirement(req: Request, res: Response): Promise<void>;
/**
 * DELETE /api/recruitment/document-requirements/:id
 * Elimina (desactiva) un requisito documental
 */
export declare function deleteOpeningDocumentRequirement(req: Request, res: Response): Promise<void>;
/**
 * GET /api/recruitment/applications/:applicationId/expediente-status
 * Obtiene el estado del expediente de una postulación
 */
export declare function getExpedienteStatus(req: Request, res: Response): Promise<void>;
/**
 * GET /api/recruitment/applications/:applicationId/expediente-progress
 * Calcula el progreso del expediente de una postulación
 */
export declare function getExpedienteProgress(req: Request, res: Response): Promise<void>;
/**
 * POST /api/recruitment/openings/:openingId/setup-default-requirements
 * Configura requisitos documentales predeterminados para una convocatoria
 */
export declare function setupDefaultDocumentRequirements(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=document-requirements.controller.d.ts.map