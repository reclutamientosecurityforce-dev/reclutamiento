import { Request, Response, NextFunction } from 'express';
interface AuditOptions {
    action: string;
    resource?: string;
    getResourceId?: (req: Request) => string | undefined;
    getDetails?: (req: Request, res: Response) => Record<string, unknown>;
}
/**
 * Middleware de auditoría.
 * Registra acciones en audit_logs con company_id del usuario autenticado.
 * Nunca toma company_id del request body/query/params.
 */
export declare function auditLog(options: AuditOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=audit.d.ts.map