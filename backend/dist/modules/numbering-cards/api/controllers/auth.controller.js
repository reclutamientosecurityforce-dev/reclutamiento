"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
exports.me = me;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const db_1 = __importDefault(require("../../../../db"));
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1),
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(1),
    companyId: zod_1.z.string().uuid().optional(),
});
/**
 * POST /api/auth/login
 * Autentica al usuario, crea sesión en PostgreSQL, devuelve JWT.
 */
async function login(req, res) {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Datos de login inválidos.', details: parsed.error.issues });
            return;
        }
        const { username, password } = parsed.data;
        // Buscar usuario por username (busca en todas las empresas si no se especifica companyId)
        const { rows } = await db_1.default.query(`SELECT id, company_id, username, email, password_hash, role, full_name, is_active
       FROM users WHERE username = $1 AND is_active = TRUE LIMIT 1`, [username]);
        if (rows.length === 0) {
            res.status(401).json({ error: 'Credenciales inválidas.' });
            return;
        }
        const user = rows[0];
        const passwordValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!passwordValid) {
            // Log de intento fallido
            await db_1.default.query(`INSERT INTO audit_logs (company_id, user_id, action, resource, details, ip_address, user_agent, success, error_message)
         VALUES ($1, $2, 'login', 'auth', $3, $4::inet, $5, FALSE, 'Contraseña incorrecta')`, [
                user.company_id, user.id,
                JSON.stringify({ username }),
                req.ip, req.get('User-Agent')
            ]);
            res.status(401).json({ error: 'Credenciales inválidas.' });
            return;
        }
        // Crear payload JWT
        const sessionId = crypto_1.default.randomUUID();
        const token = jsonwebtoken_1.default.sign({ userId: user.id, companyId: user.company_id, role: user.role, sessionId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
        // Expiración según configuración
        const expiresInMs = JWT_EXPIRES_IN === '8h'
            ? 8 * 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;
        const expiresAt = new Date(Date.now() + expiresInMs);
        // Crear sesión en PostgreSQL
        await db_1.default.query(`INSERT INTO sessions (id, user_id, company_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5::inet, $6, $7)`, [sessionId, user.id, user.company_id, tokenHash, req.ip, req.get('User-Agent'), expiresAt]);
        // Actualizar last_login_at
        await db_1.default.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
        // Auditoría
        await db_1.default.query(`INSERT INTO audit_logs (company_id, user_id, action, resource, details, ip_address, user_agent, success)
       VALUES ($1, $2, 'login', 'auth', $3, $4::inet, $5, TRUE)`, [
            user.company_id, user.id,
            JSON.stringify({ username, sessionId }),
            req.ip, req.get('User-Agent')
        ]);
        res.json({
            token,
            user: {
                id: user.id,
                companyId: user.company_id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: user.full_name,
            },
            expiresAt: expiresAt.toISOString(),
        });
    }
    catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
}
/**
 * POST /api/auth/logout
 * Invalida la sesión actual en PostgreSQL.
 */
async function logout(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado.' });
            return;
        }
        await db_1.default.query('UPDATE sessions SET is_active = FALSE WHERE id = $1 AND user_id = $2', [req.user.sessionId, req.user.id]);
        // Auditoría
        await db_1.default.query(`INSERT INTO audit_logs (company_id, user_id, action, resource, details, ip_address, user_agent, success)
       VALUES ($1, $2, 'logout', 'auth', $3, $4::inet, $5, TRUE)`, [
            req.user.companyId, req.user.id,
            JSON.stringify({ sessionId: req.user.sessionId }),
            req.ip, req.get('User-Agent')
        ]);
        res.json({ message: 'Sesión cerrada exitosamente.' });
    }
    catch (err) {
        console.error('Error en logout:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
}
/**
 * GET /api/auth/me
 * Devuelve los datos del usuario autenticado.
 */
async function me(req, res) {
    if (!req.user) {
        res.status(401).json({ error: 'No autenticado.' });
        return;
    }
    res.json({ user: req.user });
}
//# sourceMappingURL=auth.controller.js.map