"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../../../../db"));
const createUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    role: zod_1.z.enum(['admin', 'user']).default('user'),
    fullName: zod_1.z.string().max(255).optional(),
});
const updateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    role: zod_1.z.enum(['admin', 'user']).optional(),
    fullName: zod_1.z.string().max(255).optional(),
    isActive: zod_1.z.boolean().optional(),
});
/**
 * GET /api/admin/users
 * Lista usuarios de la empresa (siempre filtrado por companyId del token).
 */
async function getUsers(req, res) {
    try {
        const companyId = req.user.companyId;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 20);
        const offset = (page - 1) * limit;
        const countResult = await db_1.default.query('SELECT COUNT(*) AS count FROM users WHERE company_id = $1', [companyId]);
        const { rows } = await db_1.default.query(`SELECT id, username, email, role, full_name, is_active, last_login_at, created_at
       FROM users WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`, [companyId, limit, offset]);
        res.json({
            data: rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                page,
                limit,
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
            },
        });
    }
    catch (err) {
        console.error('Error en getUsers:', err);
        res.status(500).json({ error: 'Error al obtener usuarios.' });
    }
}
/**
 * POST /api/admin/users
 * Crea un nuevo usuario en la empresa del administrador autenticado.
 * NUNCA toma companyId del body.
 */
async function createUser(req, res) {
    try {
        const companyId = req.user.companyId; // siempre del contexto autenticado
        const parsed = createUserSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Datos inválidos.', details: parsed.error.issues });
            return;
        }
        const { username, email, password, role, fullName } = parsed.data;
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const { rows } = await db_1.default.query(`INSERT INTO users (company_id, username, email, password_hash, role, full_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, role, full_name, is_active, created_at`, [companyId, username, email, passwordHash, role, fullName || null]);
        await db_1.default.query(`INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details, ip_address, success)
       VALUES ($1, $2, 'user_created', 'users', $3, $4, $5::inet, TRUE)`, [companyId, req.user.id, rows[0].id,
            JSON.stringify({ username, email, role }), req.ip]);
        res.status(201).json(rows[0]);
    }
    catch (err) {
        const pgErr = err;
        if (pgErr.code === '23505') {
            res.status(409).json({ error: 'El username o email ya existe en esta empresa.' });
            return;
        }
        console.error('Error en createUser:', err);
        res.status(500).json({ error: 'Error al crear usuario.' });
    }
}
/**
 * PUT /api/admin/users/:id
 */
async function updateUser(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        // Verificar que el usuario pertenece a la empresa
        const check = await db_1.default.query('SELECT id FROM users WHERE id = $1 AND company_id = $2', [id, companyId]);
        if (check.rows.length === 0) {
            res.status(404).json({ error: 'Usuario no encontrado.' });
            return;
        }
        const parsed = updateUserSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Datos inválidos.', details: parsed.error.issues });
            return;
        }
        const { email, role, fullName, isActive } = parsed.data;
        const updates = [];
        const params = [];
        let idx = 1;
        if (email !== undefined) {
            updates.push(`email = $${idx++}`);
            params.push(email);
        }
        if (role !== undefined) {
            updates.push(`role = $${idx++}`);
            params.push(role);
        }
        if (fullName !== undefined) {
            updates.push(`full_name = $${idx++}`);
            params.push(fullName);
        }
        if (isActive !== undefined) {
            updates.push(`is_active = $${idx++}`);
            params.push(isActive);
        }
        if (updates.length === 0) {
            res.status(400).json({ error: 'No hay campos para actualizar.' });
            return;
        }
        params.push(id, companyId);
        const { rows } = await db_1.default.query(`UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} AND company_id = $${idx + 1}
       RETURNING id, username, email, role, full_name, is_active, updated_at`, params);
        await db_1.default.query(`INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details, ip_address, success)
       VALUES ($1, $2, 'user_updated', 'users', $3, $4, $5::inet, TRUE)`, [companyId, req.user.id, id, JSON.stringify(parsed.data), req.ip]);
        res.json(rows[0]);
    }
    catch (err) {
        console.error('Error en updateUser:', err);
        res.status(500).json({ error: 'Error al actualizar usuario.' });
    }
}
/**
 * DELETE /api/admin/users/:id (desactivar, no eliminar)
 */
async function deleteUser(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        if (id === req.user.id) {
            res.status(400).json({ error: 'No puedes desactivarte a ti mismo.' });
            return;
        }
        const { rowCount } = await db_1.default.query(`UPDATE users SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND company_id = $2`, [id, companyId]);
        if (rowCount === 0) {
            res.status(404).json({ error: 'Usuario no encontrado.' });
            return;
        }
        // Invalidar sesiones del usuario
        await db_1.default.query('UPDATE sessions SET is_active = FALSE WHERE user_id = $1', [id]);
        await db_1.default.query(`INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, ip_address, success)
       VALUES ($1, $2, 'user_deleted', 'users', $3, $4::inet, TRUE)`, [companyId, req.user.id, id, req.ip]);
        res.json({ message: 'Usuario desactivado.' });
    }
    catch (err) {
        console.error('Error en deleteUser:', err);
        res.status(500).json({ error: 'Error al desactivar usuario.' });
    }
}
//# sourceMappingURL=users.controller.js.map