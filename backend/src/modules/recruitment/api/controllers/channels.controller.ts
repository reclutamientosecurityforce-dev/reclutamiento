import { Request, Response } from 'express';
import { z } from 'zod';
import db from '../../../../db';
import { RecruitmentChannel } from '../../../../types';

const channelSchema = z.object({
  name: z.string().min(2, 'El nombre del canal debe tener al menos 2 caracteres.'),
  campaignId: z.string().uuid().optional().nullable(),
  type: z.enum(['facebook', 'instagram', 'whatsapp', 'qr', 'web', 'referral', 'campaign', 'other']).default('other'),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/recruitment/channels
 */
export async function getChannels(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const campaignId = req.query.campaignId as string | undefined;

    let whereClause = 'WHERE rc.company_id = $1';
    const params: any[] = [companyId];

    if (campaignId) {
      params.push(campaignId);
      whereClause += ` AND rc.campaign_id = $${params.length}`;
    }

    const query = `
      WITH channel_views AS (
        SELECT channel_id, COUNT(*) AS views
        FROM publication_views
        WHERE company_id = $1
        GROUP BY channel_id
      ),
      channel_apps AS (
        SELECT 
          channel_id,
          COUNT(*) AS total_apps,
          COUNT(*) FILTER (WHERE prefilter_status = 'eligible') AS apt_apps,
          COUNT(*) FILTER (WHERE current_stage = 'hired') AS hired_apps
        FROM applications
        WHERE company_id = $1
        GROUP BY channel_id
      )
      SELECT 
        rc.*,
        camp.name AS campaign_name,
        COALESCE(cv.views, 0) AS views_count,
        COALESCE(ca.total_apps, 0) AS applications_count,
        COALESCE(ca.apt_apps, 0) AS apt_count,
        COALESCE(ca.hired_apps, 0) AS hired_count
      FROM recruitment_channels rc
      LEFT JOIN recruitment_campaigns camp ON rc.campaign_id = camp.id
      LEFT JOIN channel_views cv ON cv.channel_id = rc.id
      LEFT JOIN channel_apps ca ON ca.channel_id = rc.id
      ${whereClause}
      ORDER BY rc.created_at DESC
    `;

    const { rows } = await db.query<RecruitmentChannel>(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error en getChannels:', err);
    res.status(500).json({ error: 'Error al obtener canales de captación.' });
  }
}

/**
 * POST /api/recruitment/channels
 */
export async function createChannel(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;

    const parsed = channelSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos de canal inválidos.', details: parsed.error.issues });
      return;
    }

    const d = parsed.data;

    // Si tiene campaña asociada y no tiene utmCampaign, heredar de la campaña
    let utmCampaign = d.utmCampaign;
    if (d.campaignId && !utmCampaign) {
      const campRes = await db.query<{ utm_campaign: string }>(
        `SELECT utm_campaign FROM recruitment_campaigns WHERE id = $1 AND company_id = $2`,
        [d.campaignId, companyId]
      );
      if (campRes.rows.length > 0) {
        utmCampaign = campRes.rows[0].utm_campaign;
      }
    }

    const { rows } = await db.query<RecruitmentChannel>(
      `INSERT INTO recruitment_channels (
         company_id, campaign_id, name, type, utm_source,
         utm_medium, utm_campaign, description, is_active, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        companyId,
        d.campaignId || null,
        d.name,
        d.type,
        d.utmSource || d.type,
        d.utmMedium || 'cpc',
        utmCampaign || null,
        d.description || null,
        d.isActive,
        userId,
      ]
    );

    await db.query(
      `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
       VALUES ($1, $2, 'channel_created', 'recruitment_channels', $3, $4)`,
      [companyId, userId, rows[0].id, JSON.stringify({ name: d.name, type: d.type })]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error en createChannel:', err);
    res.status(500).json({ error: 'Error al crear canal de captación.' });
  }
}

/**
 * PUT /api/recruitment/channels/:id
 */
export async function updateChannel(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { id } = req.params;

    const parsed = channelSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos.', details: parsed.error.issues });
      return;
    }

    const d = parsed.data;
    const { rows } = await db.query<RecruitmentChannel>(
      `UPDATE recruitment_channels
       SET name = COALESCE($1, name),
           campaign_id = $2,
           type = COALESCE($3, type),
           utm_source = COALESCE($4, utm_source),
           utm_medium = COALESCE($5, utm_medium),
           utm_campaign = COALESCE($6, utm_campaign),
           description = COALESCE($7, description),
           is_active = COALESCE($8, is_active)
       WHERE id = $9 AND company_id = $10
       RETURNING *`,
      [
        d.name ?? null,
        d.campaignId ? d.campaignId : null,
        d.type ?? null,
        d.utmSource ?? null,
        d.utmMedium ?? null,
        d.utmCampaign ?? null,
        d.description ?? null,
        d.isActive ?? null,
        id,
        companyId,
      ]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Canal no encontrado.' });
      return;
    }

    await db.query(
      `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
       VALUES ($1, $2, 'channel_updated', 'recruitment_channels', $3, $4)`,
      [companyId, userId, id, JSON.stringify({ name: rows[0].name })]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Error en updateChannel:', err);
    res.status(500).json({ error: 'Error al actualizar canal.' });
  }
}

/**
 * GET /api/recruitment/channels/metrics
 * Comparativa de calidad de captación entre todos los canales
 */
export async function getChannelsQualityMetrics(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;

    const query = `
      WITH channel_views AS (
        SELECT 
          channel_id,
          COUNT(*) AS total_views,
          COUNT(DISTINCT ip_hash) FILTER (WHERE is_bot = FALSE) AS unique_views
        FROM publication_views
        WHERE company_id = $1
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
          COUNT(*) FILTER (WHERE current_stage = 'hired') AS hired_apps,
          AVG(prefilter_score) FILTER (WHERE application_status = 'submitted') AS avg_score
        FROM applications
        WHERE company_id = $1
        GROUP BY channel_id
      )
      SELECT 
        rc.id AS channel_id,
        rc.name AS channel_name,
        rc.type AS channel_type,
        camp.name AS campaign_name,
        COALESCE(cv.total_views, 0) AS views,
        COALESCE(cv.unique_views, 0) AS unique_views,
        COALESCE(ca.total_apps, 0) AS started,
        COALESCE(ca.completed_apps, 0) AS completed,
        COALESCE(ca.apt_apps, 0) AS apt,
        COALESCE(ca.review_apps, 0) AS review,
        COALESCE(ca.ineligible_apps, 0) AS ineligible,
        COALESCE(ca.interview_apps, 0) AS interviewed,
        COALESCE(ca.hired_apps, 0) AS hired,
        ROUND(COALESCE(ca.avg_score, 0)::numeric, 1) AS avg_score,
        -- Métrica de Calidad: Aptos / Completadas
        CASE WHEN COALESCE(ca.completed_apps, 0) > 0 
          THEN ROUND(COALESCE(ca.apt_apps, 0)::numeric / ca.completed_apps * 100, 1) 
          ELSE 0 
        END AS quality_rate_pct,
        -- Métrica de Conversión: Completadas / Unique Views
        CASE WHEN COALESCE(cv.unique_views, 0) > 0 
          THEN ROUND(COALESCE(ca.completed_apps, 0)::numeric / cv.unique_views * 100, 1) 
          ELSE 0 
        END AS conversion_rate_pct
      FROM recruitment_channels rc
      LEFT JOIN recruitment_campaigns camp ON rc.campaign_id = camp.id
      LEFT JOIN channel_views cv ON cv.channel_id = rc.id
      LEFT JOIN channel_apps ca ON ca.channel_id = rc.id
      WHERE rc.company_id = $1
      ORDER BY COALESCE(ca.apt_apps, 0) DESC, COALESCE(ca.completed_apps, 0) DESC
    `;

    const { rows } = await db.query(query, [companyId]);
    res.json(rows);
  } catch (err) {
    console.error('Error en getChannelsQualityMetrics:', err);
    res.status(500).json({ error: 'Error al obtener métricas de canales.' });
  }
}
