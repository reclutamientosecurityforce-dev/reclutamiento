import { Request, Response } from 'express';
/**
 * GET /api/recruitment/channels
 */
export declare function getChannels(req: Request, res: Response): Promise<void>;
/**
 * POST /api/recruitment/channels
 */
export declare function createChannel(req: Request, res: Response): Promise<void>;
/**
 * PUT /api/recruitment/channels/:id
 */
export declare function updateChannel(req: Request, res: Response): Promise<void>;
/**
 * GET /api/recruitment/channels/metrics
 * Comparativa de calidad de captación entre todos los canales
 */
export declare function getChannelsQualityMetrics(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=channels.controller.d.ts.map