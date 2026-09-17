import { Request, Response } from 'express';
/**
 * GET /api/recruitment/campaigns
 * Listar campañas con conteos y métricas reales agregadas vía CTEs independientes
 */
export declare function getCampaigns(req: Request, res: Response): Promise<void>;
/**
 * GET /api/recruitment/campaigns/:id
 */
export declare function getCampaignById(req: Request, res: Response): Promise<void>;
/**
 * POST /api/recruitment/campaigns
 */
export declare function createCampaign(req: Request, res: Response): Promise<void>;
/**
 * PUT /api/recruitment/campaigns/:id
 */
export declare function updateCampaign(req: Request, res: Response): Promise<void>;
/**
 * PATCH /api/recruitment/campaigns/:id/status
 */
export declare function updateCampaignStatus(req: Request, res: Response): Promise<void>;
/**
 * GET /api/recruitment/campaigns/:id/funnel
 * Embudo detallado por canal para una campaña específica
 */
export declare function getCampaignFunnel(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=campaigns.controller.d.ts.map