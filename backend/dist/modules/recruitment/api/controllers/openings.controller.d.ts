import { Request, Response } from 'express';
/**
 * GET /api/recruitment/openings
 */
export declare function getOpenings(req: Request, res: Response): Promise<void>;
/**
 * POST /api/recruitment/openings
 */
export declare function createOpening(req: Request, res: Response): Promise<void>;
/**
 * PUT /api/recruitment/openings/:id
 */
export declare function updateOpening(req: Request, res: Response): Promise<void>;
/**
 * PUT /api/recruitment/companies/contact
 */
export declare function updateCompanyContact(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=openings.controller.d.ts.map