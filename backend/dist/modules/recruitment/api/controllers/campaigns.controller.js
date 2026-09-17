"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCampaigns = getCampaigns;
exports.getCampaignById = getCampaignById;
exports.createCampaign = createCampaign;
exports.updateCampaign = updateCampaign;
exports.updateCampaignStatus = updateCampaignStatus;
exports.getCampaignFunnel = getCampaignFunnel;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../../../../db"));
const campaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'El nombre de campaña debe tener al menos 3 caracteres.'),
    description: zod_1.z.string().optional(),
    utmCampaign: zod_1.z.string().optional(),
    status: zod_1.z.enum(['active', 'paused', 'ended', 'archived']).default('active'),
    startsAt: zod_1.z.string().optional(),
    endsAt: zod_1.z.string().optional(),
    budgetNotes: zod_1.z.string().optional(),
});
/**
 * GET /api/recruitment/campaigns
 * Listar campañas con conteos y métricas reales agregadas vía CTEs independientes
 */
async function getCampaigns(req, res) {
    try {
        const companyId = req.user.companyId;
        const status = req.query.status;
        let whereClause = 'WHERE rc.company_id = $1';
        const params = [companyId];
        if (status && status !== 'all') {
            params.push(status);
            whereClause += ` AND rc.status = $${params.length}`;
        }
        const query = `
      WITH campaign_views AS (
        SELECT campaign_id, COUNT(*) AS views, COUNT(DISTINCT ip_hash) FILTER (WHERE is_bot = FALSE) AS unique_views
        FROM publication_views
        WHERE company_id = $1 AND campaign_id IS NOT NULL
        GROUP BY campaign_id
      ),
      campaign_apps AS (
        SELECT 
          campaign_id,
          COUNT(*) AS total_apps,
          COUNT(*) FILTER (WHERE application_status = 'submitted') AS completed_apps,
          COUNT(*) FILTER (WHERE prefilter_status = 'eligible') AS apt_apps,
          COUNT(*) FILTER (WHERE current_stage = 'hired') AS hired_apps
        FROM applications
        WHERE company_id = $1 AND campaign_id IS NOT NULL
        GROUP BY campaign_id
      ),
      campaign_counts AS (
        SELECT 
          campaign_id,
          COUNT(DISTINCT id) AS channels_count
        FROM recruitment_channels
        WHERE company_id = $1 AND campaign_id IS NOT NULL
        GROUP BY campaign_id
      ),
      campaign_pubs AS (
        SELECT 
          campaign_id,
          COUNT(DISTINCT id) AS pubs_count
        FROM job_publications
        WHERE company_id = $1 AND campaign_id IS NOT NULL
        GROUP BY campaign_id
      )
      SELECT 
        rc.*,
        COALESCE(cc.channels_count, 0) AS channels_count,
        COALESCE(cp.pubs_count, 0) AS publications_count,
        COALESCE(cv.views, 0) AS calculated_views,
        COALESCE(cv.unique_views, 0) AS calculated_unique_views,
        COALESCE(ca.total_apps, 0) AS calculated_applications,
        COALESCE(ca.completed_apps, 0) AS calculated_completed,
        COALESCE(ca.apt_apps, 0) AS calculated_apt,
        COALESCE(ca.hired_apps, 0) AS calculated_hired,
        CASE WHEN COALESCE(ca.completed_apps, 0) > 0 
          THEN ROUND(COALESCE(ca.apt_apps, 0)::numeric / ca.completed_apps * 100, 1) 
          ELSE 0 
        END AS quality_rate_pct
      FROM recruitment_campaigns rc
      LEFT JOIN campaign_counts cc ON cc.campaign_id = rc.id
      LEFT JOIN campaign_pubs cp ON cp.campaign_id = rc.id
      LEFT JOIN campaign_views cv ON cv.campaign_id = rc.id
      LEFT JOIN campaign_apps ca ON ca.campaign_id = rc.id
      ${whereClause}
      ORDER BY rc.created_at DESC
    `;
        const { rows } = await db_1.default.query(query, params);
        res.json(rows);
    }
    catch (err) {
        console.error('Error en getCampaigns:', err);
        res.status(500).json({ error: 'Error al obtener campañas.' });
    }
}
/**
 * GET /api/recruitment/campaigns/:id
 */
async function getCampaignById(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const { rows } = await db_1.default.query(`SELECT * FROM recruitment_campaigns WHERE id = $1 AND company_id = $2`, [id, companyId]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Campaña no encontrada.' });
            return;
        }
        res.json(rows[0]);
    }
    catch (err) {
        console.error('Error en getCampaignById:', err);
        res.status(500).json({ error: 'Error al obtener campaña.' });
    }
}
/**
 * POST /api/recruitment/campaigns
 */
async function createCampaign(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const parsed = campaignSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Datos de campaña inválidos.', details: parsed.error.issues });
            return;
        }
        const d = parsed.data;
        const utm = d.utmCampaign || d.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 50);
        const { rows } = await db_1.default.query(`INSERT INTO recruitment_campaigns (
         company_id, name, description, utm_campaign, status,
         starts_at, ends_at, budget_notes, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`, [
            companyId,
            d.name,
            d.description || null,
            utm,
            d.status,
            d.startsAt || null,
            d.endsAt || null,
            d.budgetNotes || null,
            userId,
        ]);
        await db_1.default.query(`INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
       VALUES ($1, $2, 'campaign_created', 'recruitment_campaigns', $3, $4)`, [companyId, userId, rows[0].id, JSON.stringify({ name: d.name, utm })]);
        res.status(201).json(rows[0]);
    }
    catch (err) {
        console.error('Error en createCampaign:', err);
        res.status(500).json({ error: 'Error al crear campaña.' });
    }
}
/**
 * PUT /api/recruitment/campaigns/:id
 */
async function updateCampaign(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const { id } = req.params;
        const parsed = campaignSchema.partial().safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Datos inválidos.', details: parsed.error.issues });
            return;
        }
        const d = parsed.data;
        const { rows } = await db_1.default.query(`UPDATE recruitment_campaigns
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           utm_campaign = COALESCE($3, utm_campaign),
           status = COALESCE($4, status),
           starts_at = COALESCE($5, starts_at),
           ends_at = COALESCE($6, ends_at),
           budget_notes = COALESCE($7, budget_notes),
           updated_at = NOW()
       WHERE id = $8 AND company_id = $9
       RETURNING *`, [
            d.name,
            d.description,
            d.utmCampaign,
            d.status,
            d.startsAt,
            d.endsAt,
            d.budgetNotes,
            id,
            companyId,
        ]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Campaña no encontrada.' });
            return;
        }
        await db_1.default.query(`INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
       VALUES ($1, $2, 'campaign_updated', 'recruitment_campaigns', $3, $4)`, [companyId, userId, id, JSON.stringify({ name: rows[0].name })]);
        res.json(rows[0]);
    }
    catch (err) {
        console.error('Error en updateCampaign:', err);
        res.status(500).json({ error: 'Error al actualizar campaña.' });
    }
}
/**
 * PATCH /api/recruitment/campaigns/:id/status
 */
async function updateCampaignStatus(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;
        if (!['active', 'paused', 'ended', 'archived'].includes(status)) {
            res.status(400).json({ error: 'Estado de campaña inválido.' });
            return;
        }
        const { rows } = await db_1.default.query(`UPDATE recruitment_campaigns
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND company_id = $3
       RETURNING *`, [status, id, companyId]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Campaña no encontrada.' });
            return;
        }
        await db_1.default.query(`INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
       VALUES ($1, $2, 'campaign_status_changed', 'recruitment_campaigns', $3, $4)`, [companyId, userId, id, JSON.stringify({ status })]);
        res.json(rows[0]);
    }
    catch (err) {
        console.error('Error en updateCampaignStatus:', err);
        res.status(500).json({ error: 'Error al cambiar estado de la campaña.' });
    }
}
/**
 * GET /api/recruitment/campaigns/:id/funnel
 * Embudo detallado por canal para una campaña específica
 */
async function getCampaignFunnel(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const query = `
      WITH channel_views AS (
        SELECT channel_id, COUNT(*) AS views, COUNT(DISTINCT ip_hash) FILTER (WHERE is_bot = FALSE) AS unique_views
        FROM publication_views
        WHERE company_id = $1 AND campaign_id = $2
        GROUP BY channel_id
      ),
      channel_apps AS (
        SELECT 
          channel_id,
          COUNT(*) AS total_apps,
          COUNT(*) FILTER (WHERE application_status = 'submitted') AS completed_apps,
          COUNT(*) FILTER (WHERE prefilter_status = 'eligible') AS apt_apps,
          COUNT(*) FILTER (WHERE prefilter_status = 'review') AS review_apps,
          COUNT(*) FILTER (WHERE prefilter_status = 'ineligible') AS ineligible_apps,
          COUNT(*) FILTER (WHERE current_stage = 'interview') AS interview_apps,
          COUNT(*) FILTER (WHERE current_stage = 'hired') AS hired_apps
        FROM applications
        WHERE company_id = $1 AND campaign_id = $2
        GROUP BY channel_id
      )
      SELECT 
        rc.id AS channel_id,
        rc.name AS channel_name,
        rc.type AS channel_type,
        COALESCE(cv.views, 0) AS views,
        COALESCE(cv.unique_views, 0) AS unique_views,
        COALESCE(ca.total_apps, 0) AS started,
        COALESCE(ca.completed_apps, 0) AS completed,
        COALESCE(ca.apt_apps, 0) AS apt,
        COALESCE(ca.review_apps, 0) AS review,
        COALESCE(ca.ineligible_apps, 0) AS ineligible,
        COALESCE(ca.interview_apps, 0) AS interviewed,
        COALESCE(ca.hired_apps, 0) AS hired,
        CASE WHEN COALESCE(ca.completed_apps, 0) > 0 
          THEN ROUND(COALESCE(ca.apt_apps, 0)::numeric / ca.completed_apps * 100, 1) 
          ELSE 0 
        END AS quality_rate_pct
      FROM recruitment_channels rc
      LEFT JOIN channel_views cv ON cv.channel_id = rc.id
      LEFT JOIN channel_apps ca ON ca.channel_id = rc.id
      WHERE rc.company_id = $1 AND rc.campaign_id = $2
      ORDER BY COALESCE(ca.apt_apps, 0) DESC
    `;
        const { rows } = await db_1.default.query(query, [companyId, id]);
        res.json(rows);
    }
    catch (err) {
        console.error('Error en getCampaignFunnel:', err);
        res.status(500).json({ error: 'Error al obtener embudo de campaña.' });
    }
}
//# sourceMappingURL=campaigns.controller.js.map