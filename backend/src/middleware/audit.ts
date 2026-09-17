import { Request, Response, NextFunction } from 'express';
import db from '../db';

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
export function auditLog(options: AuditOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);
    let responseBody: unknown;
    let statusCode = 200;

    res.json = function (body: unknown) {
      responseBody = body;
      statusCode = res.statusCode;
      return originalJson(body);
    };

    res.on('finish', async () => {
      if (!req.user) return;

      const success = statusCode < 400;
      const errorMessage = !success && responseBody
        ? (responseBody as { error?: string }).error
        : undefined;

      try {
        const details = options.getDetails
          ? options.getDetails(req, res)
          : {};

        await db.query(
          `INSERT INTO audit_logs
           (company_id, user_id, action, resource, resource_id, details, ip_address, user_agent, success, error_message)
           VALUES ($1, $2, $3, $4, $5, $6, $7::inet, $8, $9, $10)`,
          [
            req.user.companyId,
            req.user.id,
            options.action,
            options.resource || null,
            options.getResourceId ? options.getResourceId(req) : null,
            JSON.stringify(details),
            req.ip || null,
            req.get('User-Agent') || null,
            success,
            errorMessage || null,
          ]
        );
      } catch (err) {
        // Nunca fallar por error de auditoría
        console.error('Error en audit_log middleware:', err);
      }
    });

    next();
  };
}
