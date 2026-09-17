"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRanges = getRanges;
exports.createRange = createRange;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../../../../db"));
const createRangeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    prefix: zod_1.z.string().max(50).optional(),
    rangeStart: zod_1.z.number().int().positive(),
    rangeEnd: zod_1.z.number().int().positive(),
}).refine(d => d.rangeEnd >= d.rangeStart, { message: 'rangeEnd >= rangeStart' });
/**
 * GET /api/admin/ranges
 */
async function getRanges(req, res) {
    try {
        const companyId = req.user.companyId;
        const { rows } = await db_1.default.query(`SELECT nr.*,
              COUNT(c.id) FILTER (WHERE c.status = 'available') AS available_count,
              COUNT(c.id) FILTER (WHERE c.status = 'used')      AS used_count,
              COUNT(c.id) AS total_count
       FROM numbering_ranges nr
       LEFT JOIN cards c ON c.range_id = nr.id
       WHERE nr.company_id = $1
       GROUP BY nr.id
       ORDER BY nr.created_at DESC`, [companyId]);
        res.json(rows);
    }
    catch (err) {
        console.error('Error en getRanges:', err);
        res.status(500).json({ error: 'Error al obtener rangos.' });
    }
}
/**
 * POST /api/admin/ranges
 */
async function createRange(req, res) {
    try {
        const companyId = req.user.companyId;
        const parsed = createRangeSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Datos inválidos.', details: parsed.error.issues });
            return;
        }
        const { name, prefix, rangeStart, rangeEnd } = parsed.data;
        const { rows } = await db_1.default.query(`INSERT INTO numbering_ranges (company_id, name, prefix, range_start, range_end, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [companyId, name, prefix || null, rangeStart, rangeEnd, req.user.id]);
        await db_1.default.query(`INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details, ip_address, success)
       VALUES ($1, $2, 'range_created', 'numbering_ranges', $3, $4, $5::inet, TRUE)`, [companyId, req.user.id, rows[0].id,
            JSON.stringify({ name, rangeStart, rangeEnd }), req.ip]);
        res.status(201).json(rows[0]);
    }
    catch (err) {
        const pgErr = err;
        if (pgErr.code === '23505') {
            res.status(409).json({ error: 'Ya existe un rango con ese nombre en esta empresa.' });
            return;
        }
        console.error('Error en createRange:', err);
        res.status(500).json({ error: 'Error al crear rango.' });
    }
}
//# sourceMappingURL=ranges.controller.js.map