"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
const db_1 = __importDefault(require("../db"));
/**
 * Middleware de auditoría.
 * Registra acciones en audit_logs con company_id del usuario autenticado.
 * Nunca toma company_id del request body/query/params.
 */
function auditLog(options) {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);
        let responseBody;
        let statusCode = 200;
        res.json = function (body) {
            responseBody = body;
            statusCode = res.statusCode;
            return originalJson(body);
        };
        res.on('finish', async () => {
            if (!req.user)
                return;
            const success = statusCode < 400;
            const errorMessage = !success && responseBody
                ? responseBody.error
                : undefined;
            try {
                const details = options.getDetails
                    ? options.getDetails(req, res)
                    : {};
                await db_1.default.query(`INSERT INTO audit_logs
           (company_id, user_id, action, resource, resource_id, details, ip_address, user_agent, success, error_message)
           VALUES ($1, $2, $3, $4, $5, $6, $7::inet, $8, $9, $10)`, [
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
                ]);
            }
            catch (err) {
                // Nunca fallar por error de auditoría
                console.error('Error en audit_log middleware:', err);
            }
        });
        next();
    };
}
//# sourceMappingURL=audit.js.map