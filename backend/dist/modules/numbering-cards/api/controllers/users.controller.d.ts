import { Request, Response } from 'express';
/**
 * GET /api/admin/users
 * Lista usuarios de la empresa (siempre filtrado por companyId del token).
 */
export declare function getUsers(req: Request, res: Response): Promise<void>;
/**
 * POST /api/admin/users
 * Crea un nuevo usuario en la empresa del administrador autenticado.
 * NUNCA toma companyId del body.
 */
export declare function createUser(req: Request, res: Response): Promise<void>;
/**
 * PUT /api/admin/users/:id
 */
export declare function updateUser(req: Request, res: Response): Promise<void>;
/**
 * DELETE /api/admin/users/:id (desactivar, no eliminar)
 */
export declare function deleteUser(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=users.controller.d.ts.map