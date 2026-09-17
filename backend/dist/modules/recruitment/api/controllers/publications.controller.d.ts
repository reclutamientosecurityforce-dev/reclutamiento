import { Request, Response } from 'express';
/**
 * GET /api/recruitment/publications
 */
export declare function getPublications(req: Request, res: Response): Promise<void>;
/**
 * GET /api/recruitment/publications/:id
 */
export declare function getPublicationById(req: Request, res: Response): Promise<void>;
/**
 * POST /api/recruitment/publications
 * Crear publicación desde Convocatoria o Centro de Captación
 */
export declare function createPublication(req: Request, res: Response): Promise<void>;
/**
 * PUT /api/recruitment/publications/:id
 * Editar publicación (solo modifica presentación, jamás reglas de evaluación)
 */
export declare function updatePublication(req: Request, res: Response): Promise<void>;
/**
 * POST /api/recruitment/publications/:id/status
 * Transición de estado con validación estricta de la máquina de estados
 */
export declare function changePublicationStatus(req: Request, res: Response): Promise<void>;
/**
 * POST /api/recruitment/publications/:id/duplicate
 * Duplica publicación (estructura, portada, beneficios) pero NO postulantes ni métricas
 */
export declare function duplicatePublication(req: Request, res: Response): Promise<void>;
/**
 * DELETE /api/recruitment/publications/:id
 * Solo permite eliminar si está en borrador y tiene 0 postulaciones
 */
export declare function deletePublication(req: Request, res: Response): Promise<void>;
/**
 * GET /api/recruitment/publications/:id/metrics
 * Métricas detalladas con embudo por canal y serie temporal diaria
 */
export declare function getPublicationMetrics(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=publications.controller.d.ts.map