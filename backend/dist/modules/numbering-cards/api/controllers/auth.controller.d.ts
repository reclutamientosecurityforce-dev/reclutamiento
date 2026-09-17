import { Request, Response } from 'express';
/**
 * POST /api/auth/login
 * Autentica al usuario, crea sesión en PostgreSQL, devuelve JWT.
 */
export declare function login(req: Request, res: Response): Promise<void>;
/**
 * POST /api/auth/logout
 * Invalida la sesión actual en PostgreSQL.
 */
export declare function logout(req: Request, res: Response): Promise<void>;
/**
 * GET /api/auth/me
 * Devuelve los datos del usuario autenticado.
 */
export declare function me(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map