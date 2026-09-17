import { Request, Response } from 'express';
/**
 * GET /api/pipeline
 * Lista todas las postulaciones activas agrupadas por etapa para vista Kanban o lista.
 */
export declare function getPipelineApplications(req: Request, res: Response): Promise<void>;
/**
 * POST /api/pipeline/:id/advance
 * Avanza o cambia de etapa a un postulante y registra la evaluación.
 */
export declare function advanceCandidateStage(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=pipeline.controller.d.ts.map