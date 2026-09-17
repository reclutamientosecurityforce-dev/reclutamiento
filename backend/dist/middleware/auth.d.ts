import { Request, Response, NextFunction } from 'express';
/**
 * Middleware de autenticación JWT.
 * Verifica el token, valida la sesión en PostgreSQL y adjunta req.user.
 */
export declare function authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Middleware RBAC — requiere rol de administrador.
 */
export declare function requireAdmin(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware RBAC — requiere usuario autenticado (cualquier rol).
 */
export declare function requireUser(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map