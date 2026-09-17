import { Request, Response } from 'express';
/**
 * GET /api/candidates
 * Lista paginada con búsqueda por DNI o nombres y filtros por SUCAMEC.
 */
export declare function getCandidates(req: Request, res: Response): Promise<void>;
/**
 * GET /api/candidates/:id
 */
export declare function getCandidate(req: Request, res: Response): Promise<void>;
/**
 * POST /api/candidates
 * Registro de nuevo postulante.
 */
export declare function createCandidate(req: Request, res: Response): Promise<void>;
/**
 * PUT /api/candidates/:id
 */
export declare function updateCandidate(req: Request, res: Response): Promise<void>;
/**
 * GET /api/candidates/:id/expediente
 * Vista maestra del expediente digital del candidato con historial, documentos y evaluaciones.
 */
export declare function getCandidateExpediente(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=candidates.controller.d.ts.map