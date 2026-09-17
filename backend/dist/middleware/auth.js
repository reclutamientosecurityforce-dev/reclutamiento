"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireAdmin = requireAdmin;
exports.requireUser = requireUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../db"));
const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET no está configurado en las variables de entorno.');
    process.exit(1);
}
/**
 * Middleware de autenticación JWT.
 * Verifica el token, valida la sesión en PostgreSQL y adjunta req.user.
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Token de autenticación requerido.' });
            return;
        }
        const token = authHeader.substring(7);
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch {
            res.status(401).json({ error: 'Token inválido o expirado.' });
            return;
        }
        // Verificar sesión activa en PostgreSQL
        const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const { rows } = await db_1.default.query(`SELECT id, is_active, expires_at FROM sessions
       WHERE token_hash = $1 AND user_id = $2 AND company_id = $3`, [tokenHash, payload.userId, payload.companyId]);
        if (rows.length === 0 || !rows[0].is_active) {
            res.status(401).json({ error: 'Sesión inactiva o no encontrada.' });
            return;
        }
        if (new Date(rows[0].expires_at) < new Date()) {
            res.status(401).json({ error: 'Sesión expirada.' });
            return;
        }
        // Actualizar last_seen_at
        await db_1.default.query('UPDATE sessions SET last_seen_at = NOW() WHERE id = $1', [rows[0].id]);
        // Obtener datos actualizados del usuario
        const userResult = await db_1.default.query(`SELECT id, company_id, username, email, role, full_name, is_active
       FROM users WHERE id = $1 AND company_id = $2`, [payload.userId, payload.companyId]);
        if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
            res.status(401).json({ error: 'Usuario inactivo o no encontrado.' });
            return;
        }
        const user = userResult.rows[0];
        req.user = {
            id: user.id,
            companyId: user.company_id,
            username: user.username,
            email: user.email,
            role: user.role,
            fullName: user.full_name,
            sessionId: rows[0].id,
        };
        next();
    }
    catch (err) {
        console.error('Error en authenticate:', err);
        res.status(500).json({ error: 'Error interno de autenticación.' });
    }
}
/**
 * Middleware RBAC — requiere rol de administrador.
 */
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
        return;
    }
    next();
}
/**
 * Middleware RBAC — requiere usuario autenticado (cualquier rol).
 */
function requireUser(req, res, next) {
    if (!req.user) {
        res.status(401).json({ error: 'Autenticación requerida.' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map