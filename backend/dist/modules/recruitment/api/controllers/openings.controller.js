"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenings = getOpenings;
exports.createOpening = createOpening;
exports.updateOpening = updateOpening;
exports.updateCompanyContact = updateCompanyContact;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../../../../db"));
const openingSchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid().optional().nullable(),
    title: zod_1.z.string().min(3),
    positionType: zod_1.z.string().min(2),
    location: zod_1.z.string().min(2),
    clientName: zod_1.z.string().optional().nullable(),
    vacanciesCount: zod_1.z.number().int().positive(),
    salaryOffered: zod_1.z.number().positive().optional().nullable(),
    shiftType: zod_1.z.string().default('12x12 Rotativo'),
    status: zod_1.z.enum(['open', 'in_progress', 'filled', 'cancelled']).default('open'),
    requirements: zod_1.z.object({
        minHeight: zod_1.z.number().optional(),
        sucamecRequired: zod_1.z.boolean().optional(),
        licenseRequired: zod_1.z.boolean().optional(),
        experienceYears: zod_1.z.number().optional(),
    }).optional(),
    description: zod_1.z.string().optional().nullable(),
    createFromCategoryTemplate: zod_1.z.boolean().optional(),
});
/**
 * GET /api/recruitment/openings
 */
async function getOpenings(req, res) {
    try {
        const companyId = req.user.companyId;
        const status = req.query.status;
        const categoryId = req.query.categoryId;
        const conditions = ['jo.company_id = $1'];
        const params = [companyId];
        let idx = 2;
        if (status && status !== 'all') {
            conditions.push(`jo.status = $${idx++}`);
            params.push(status);
        }
        if (categoryId && categoryId !== 'all') {
            conditions.push(`jo.category_id = $${idx++}`);
            params.push(categoryId);
        }
        const { rows } = await db_1.default.query(`SELECT 
         jo.*,
         jc.name AS category_name,
         jc.slug AS category_slug,
         COUNT(DISTINCT a.id) FILTER (WHERE a.current_stage NOT IN ('rejected', 'hired')) AS active_candidates_count,
         COUNT(DISTINCT jp.id) AS publications_count
       FROM job_openings jo
       LEFT JOIN job_categories jc ON jo.category_id = jc.id
       LEFT JOIN applications a ON jo.id = a.job_opening_id
       LEFT JOIN job_publications jp ON jo.id = jp.job_opening_id
       WHERE ${conditions.join(' AND ')}
       GROUP BY jo.id, jc.name, jc.slug
       ORDER BY jo.created_at DESC`, params);
        res.json(rows);
    }
    catch (err) {
        console.error('Error en getOpenings:', err);
        res.status(500).json({ error: 'Error al obtener convocatorias.' });
    }
}
/**
 * POST /api/recruitment/openings
 */
async function createOpening(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const parsed = openingSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Datos de convocatoria inválidos.', details: parsed.error.issues });
            return;
        }
        const d = parsed.data;
        const result = await db_1.default.transaction(async (client) => {
            // 1. Insertar convocatoria
            const { rows } = await client.query(`INSERT INTO job_openings (
           company_id, category_id, title, position_type, location, client_name,
           vacancies_count, salary_offered, shift_type, status,
           requirements, description, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`, [
                companyId,
                d.categoryId || null,
                d.title,
                d.positionType,
                d.location,
                d.clientName || null,
                d.vacanciesCount,
                d.salaryOffered || null,
                d.shiftType,
                d.status,
                JSON.stringify(d.requirements || {}),
                d.description || null,
                userId,
            ]);
            const opening = rows[0];
            // 2. Si se solicitó crear desde plantilla de categoría, cargar requisitos iniciales
            if (d.categoryId && d.createFromCategoryTemplate) {
                const catRes = await client.query(`SELECT template_requirements FROM job_categories WHERE id = $1 AND company_id = $2`, [d.categoryId, companyId]);
                if (catRes.rows.length > 0 && Array.isArray(catRes.rows[0].template_requirements)) {
                    const tpl = catRes.rows[0].template_requirements;
                    for (let i = 0; i < tpl.length; i++) {
                        const reqItem = tpl[i];
                        await client.query(`INSERT INTO opening_requirements (
                 company_id, job_opening_id, version, code, title, description,
                 requirement_type, rule_type, rule_config, weight_score,
                 required_document_type, order_index, is_active
               ) VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)`, [
                            companyId,
                            opening.id,
                            reqItem.code || `REQ_${i + 1}`,
                            reqItem.title || 'Requisito',
                            reqItem.description || null,
                            reqItem.requirement_type || 'eliminatory',
                            reqItem.rule_type || 'exists',
                            JSON.stringify(reqItem.rule_config || {}),
                            reqItem.weight_score || 0,
                            reqItem.required_document_type || null,
                            reqItem.order_index ?? i,
                        ]);
                    }
                }
            }
            // 3. Auditoría
            await client.query(`INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details, ip_address, success)
         VALUES ($1, $2, 'opening_created', 'job_openings', $3, $4, $5::inet, TRUE)`, [companyId, userId, opening.id, JSON.stringify({ title: d.title, vacancies: d.vacanciesCount, categoryId: d.categoryId }), req.ip]);
            return opening;
        });
        res.status(201).json(result);
    }
    catch (err) {
        console.error('Error en createOpening:', err);
        res.status(500).json({ error: 'Error al crear convocatoria.' });
    }
}
/**
 * PUT /api/recruitment/openings/:id
 */
async function updateOpening(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const parsed = openingSchema.partial().safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Datos inválidos.', details: parsed.error.issues });
            return;
        }
        const d = parsed.data;
        const { rows } = await db_1.default.query(`UPDATE job_openings
       SET category_id = COALESCE($1, category_id),
           title = COALESCE($2, title),
           position_type = COALESCE($3, position_type),
           location = COALESCE($4, location),
           client_name = COALESCE($5, client_name),
           vacancies_count = COALESCE($6, vacancies_count),
           salary_offered = COALESCE($7, salary_offered),
           shift_type = COALESCE($8, shift_type),
           status = COALESCE($9, status),
           description = COALESCE($10, description),
           updated_at = NOW()
       WHERE id = $11 AND company_id = $12
       RETURNING *`, [
            d.categoryId,
            d.title,
            d.positionType,
            d.location,
            d.clientName,
            d.vacanciesCount,
            d.salaryOffered,
            d.shiftType,
            d.status,
            d.description,
            id,
            companyId,
        ]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Convocatoria no encontrada.' });
            return;
        }
        res.json(rows[0]);
    }
    catch (err) {
        console.error('Error en updateOpening:', err);
        res.status(500).json({ error: 'Error al actualizar convocatoria.' });
    }
}
/**
 * PUT /api/recruitment/companies/contact
 */
async function updateCompanyContact(req, res) {
    try {
        const companyId = req.user.companyId;
        const { phone, whatsapp, email, facebook_url, instagram_url, linkedin_url, hours, address } = req.body;
        const { rows } = await db_1.default.query(`UPDATE companies 
       SET phone = COALESCE($1, phone),
           whatsapp = COALESCE($2, whatsapp),
           email = COALESCE($3, email),
           facebook_url = COALESCE($4, facebook_url),
           instagram_url = COALESCE($5, instagram_url),
           linkedin_url = COALESCE($6, linkedin_url),
           hours = COALESCE($7, hours),
           address = COALESCE($8, address),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`, [phone, whatsapp, email, facebook_url, instagram_url, linkedin_url, hours, address, companyId]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Empresa no encontrada.' });
            return;
        }
        res.json({ message: 'Información de contacto actualizada correctamente.', company: rows[0] });
    }
    catch (err) {
        console.error('Error en updateCompanyContact:', err);
        res.status(500).json({ error: 'Error al actualizar información de contacto.' });
    }
}
//# sourceMappingURL=openings.controller.js.map