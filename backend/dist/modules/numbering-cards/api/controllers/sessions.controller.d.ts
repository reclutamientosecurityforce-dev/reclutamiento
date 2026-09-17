import { Request, Response } from 'express';
/**
 * GET /api/admin/sessions
 * Lista sesiones activas de la empresa.
 */
export declare function getSessions(req: Request, res: Response): Promise<void>;
/**
 * DELETE /api/admin/sessions/:id
 * Cierra una sesión remotamente (solo admin, dentro de su empresa).
 */
export declare function terminateSession(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=sessions.controller.d.ts.map