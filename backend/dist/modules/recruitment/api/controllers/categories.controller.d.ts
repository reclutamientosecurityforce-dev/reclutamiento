import { Request, Response } from 'express';
/**
 * GET /api/recruitment/categories
 * Listar categorías de la empresa con métricas de convocatorias y publicaciones
 */
export declare function getCategories(req: Request, res: Response): Promise<void>;
/**
 * GET /api/recruitment/categories/:id
 */
export declare function getCategoryById(req: Request, res: Response): Promise<void>;
/**
 * POST /api/recruitment/categories
 */
export declare function createCategory(req: Request, res: Response): Promise<void>;
/**
 * PUT /api/recruitment/categories/:id
 */
export declare function updateCategory(req: Request, res: Response): Promise<void>;
/**
 * PATCH /api/recruitment/categories/:id/toggle
 */
export declare function toggleCategoryStatus(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=categories.controller.d.ts.map