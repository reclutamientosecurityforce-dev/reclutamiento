import { Request, Response } from 'express';
/**
 * GET /api/recruitment/captacion/summary
 * Métricas consolidadas del Centro de Captación
 */
export declare function getCaptacionSummary(req: Request, res: Response): Promise<void>;
/**
 * GET /api/recruitment/captacion/funnel
 * Embudo por canal con CTEs independientes
 */
export declare function getCaptacionFunnel(req: Request, res: Response): Promise<void>;
/**
 * GET /api/recruitment/captacion/category-stats
 * Rendimiento por categoría de puesto
 */
export declare function getCategoryStats(req: Request, res: Response): Promise<void>;
/**
 * GET /api/recruitment/captacion/top-openings
 * Convocatorias más efectivas
 */
export declare function getTopOpeningsCaptacion(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=captacion.dashboard.controller.d.ts.map