import { Request, Response } from 'express';
import db from '../../../../db';

/**
 * GET /api/recruitment/captacion/summary
 * Métricas consolidadas del Centro de Captación
 */
export async function getCaptacionSummary(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;

    const query = `
      WITH counts_pubs AS (
        SELECT 
          COUNT(*) AS total_publications,
          COUNT(*) FILTER (WHERE status = 'published') AS active_publications,
          COUNT(*) FILTER (WHERE status = 'paused') AS paused_publications,
          COUNT(*) FILTER (WHERE status = 'closed') AS closed_publications
        FROM job_publications
        WHERE company_id = $1
      ),
      counts_views AS (
        SELECT 
          COUNT(*) AS total_views,
          COUNT(DISTINCT ip_hash) FILTER (WHERE is_bot = FALSE) AS unique_views,
          COUNT(*) FILTER (WHERE is_bot = TRUE) AS bot_views,
          COUNT(*) FILTER (WHERE viewed_at >= NOW() - INTERVAL '7 days') AS views_7d,
          COUNT(*) FILTER (WHERE viewed_at >= NOW() - INTERVAL '30 days') AS views_30d
        FROM publication_views
        WHERE company_id = $1
      ),
      counts_apps AS (
        SELECT 
          COUNT(*) AS total_applications,
          COUNT(*) FILTER (WHERE application_status = 'submitted') AS completed_applications,
          COUNT(*) FILTER (WHERE prefilter_status = 'eligible') AS apt_applications,
          COUNT(*) FILTER (WHERE prefilter_status = 'review') AS review_applications,
          COUNT(*) FILTER (WHERE prefilter_status = 'ineligible') AS ineligible_applications,
          COUNT(*) FILTER (WHERE current_stage = 'interview') AS interviewed_applications,
          COUNT(*) FILTER (WHERE current_stage = 'hired') AS hired_applications,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS apps_7d,
          AVG(prefilter_score) FILTER (WHERE application_status = 'submitted') AS avg_prefilter_score
        FROM applications
        WHERE company_id = $1 AND publication_id IS NOT NULL
      )
      SELECT 
        cp.*,
        cv.*,
        ca.*,
        -- Tasa de calidad: Aptos / Completadas
        CASE WHEN ca.completed_applications > 0 
          THEN ROUND(ca.apt_applications::numeric / ca.completed_applications * 100, 1) 
          ELSE 0 
        END AS global_quality_rate_pct,
        -- Tasa de conversión: Completadas / Vistas Únicas Estimadas
        CASE WHEN cv.unique_views > 0 
          THEN ROUND(ca.completed_applications::numeric / cv.unique_views * 100, 1) 
          ELSE 0 
        END AS global_conversion_rate_pct
      FROM counts_pubs cp
      CROSS JOIN counts_views cv
      CROSS JOIN counts_apps ca
    `;

    const { rows } = await db.query(query, [companyId]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error en getCaptacionSummary:', err);
    res.status(500).json({ error: 'Error al obtener resumen de captación.' });
  }
}

/**
 * GET /api/recruitment/captacion/funnel
 * Embudo por canal con CTEs independientes
 */
export async function getCaptacionFunnel(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { startDate, endDate, campaignId } = req.query;

    const conditionsViews = ['pv.company_id = $1'];
    const conditionsApps = ['a.company_id = $1 AND a.publication_id IS NOT NULL'];
    const params: any[] = [companyId];

    if (startDate) {
      params.push(startDate);
      conditionsViews.push(`pv.viewed_at >= $${params.length}`);
      conditionsApps.push(`a.created_at >= $${params.length}`);
    }
    if (endDate) {
      params.push(endDate);
      conditionsViews.push(`pv.viewed_at <= $${params.length}`);
      conditionsApps.push(`a.created_at <= $${params.length}`);
    }
    if (campaignId) {
      params.push(campaignId);
      conditionsViews.push(`pv.campaign_id = $${params.length}`);
      conditionsApps.push(`a.campaign_id = $${params.length}`);
    }

    const query = `
      WITH channel_views AS (
        SELECT 
          channel_id,
          COUNT(*) AS views,
          COUNT(DISTINCT ip_hash) FILTER (WHERE is_bot = FALSE) AS unique_views
        FROM publication_views pv
        WHERE ${conditionsViews.join(' AND ')}
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
        FROM applications a
        WHERE ${conditionsApps.join(' AND ')}
        GROUP BY channel_id
      )
      SELECT 
        COALESCE(rc.id::text, 'direct') AS channel_id,
        COALESCE(rc.name, 'Acceso Web Directo / Sin Canal') AS channel_name,
        COALESCE(rc.type, 'web') AS channel_type,
        COALESCE(cv.views, 0) AS views,
        COALESCE(cv.unique_views, 0) AS unique_views,
        COALESCE(ca.total_apps, 0) AS started,
        COALESCE(ca.completed_apps, 0) AS completed,
        COALESCE(ca.apt_apps, 0) AS apt,
        COALESCE(ca.review_apps, 0) AS review,
        COALESCE(ca.ineligible_apps, 0) AS ineligible,
        COALESCE(ca.interview_apps, 0) AS interviewed,
        COALESCE(ca.hired_apps, 0) AS hired,
        ROUND(COALESCE(ca.avg_score, 0)::numeric, 1) AS avg_score,
        -- Calidad: Aptos / Completadas
        CASE WHEN COALESCE(ca.completed_apps, 0) > 0 
          THEN ROUND(COALESCE(ca.apt_apps, 0)::numeric / ca.completed_apps * 100, 1) 
          ELSE 0 
        END AS quality_rate_pct,
        -- Conversión: Completadas / Unique Views
        CASE WHEN COALESCE(cv.unique_views, 0) > 0 
          THEN ROUND(COALESCE(ca.completed_apps, 0)::numeric / cv.unique_views * 100, 1) 
          ELSE 0 
        END AS conversion_rate_pct
      FROM recruitment_channels rc
      FULL OUTER JOIN channel_views cv ON cv.channel_id = rc.id
      FULL OUTER JOIN channel_apps ca ON ca.channel_id = rc.id
      WHERE (rc.company_id = $1 OR rc.company_id IS NULL)
      ORDER BY COALESCE(ca.apt_apps, 0) DESC, COALESCE(ca.completed_apps, 0) DESC
    `;

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error en getCaptacionFunnel:', err);
    res.status(500).json({ error: 'Error al obtener embudo de captación.' });
  }
}

/**
 * GET /api/recruitment/captacion/category-stats
 * Rendimiento por categoría de puesto
 */
export async function getCategoryStats(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;

    const query = `
      SELECT 
        jc.id AS category_id,
        jc.name AS category_name,
        jc.icon AS category_icon,
        jc.color_hex AS category_color,
        COUNT(DISTINCT jo.id) AS openings_count,
        COUNT(DISTINCT jp.id) AS publications_count,
        COUNT(a.id) AS applications_count,
        COUNT(a.id) FILTER (WHERE a.prefilter_status = 'eligible') AS apt_count,
        COUNT(a.id) FILTER (WHERE a.current_stage = 'hired') AS hired_count,
        ROUND(COALESCE(AVG(a.prefilter_score) FILTER (WHERE a.application_status = 'submitted'), 0)::numeric, 1) AS avg_score,
        CASE WHEN COUNT(a.id) FILTER (WHERE a.application_status = 'submitted') > 0
          THEN ROUND(COUNT(a.id) FILTER (WHERE a.prefilter_status = 'eligible')::numeric / COUNT(a.id) FILTER (WHERE a.application_status = 'submitted') * 100, 1)
          ELSE 0
        END AS quality_rate_pct
      FROM job_categories jc
      LEFT JOIN job_openings jo ON jc.id = jo.category_id AND jo.company_id = jc.company_id
      LEFT JOIN job_publications jp ON jo.id = jp.job_opening_id AND jp.company_id = jc.company_id
      LEFT JOIN applications a ON jo.id = a.job_opening_id AND a.company_id = jc.company_id
      WHERE jc.company_id = $1
      GROUP BY jc.id
      ORDER BY applications_count DESC, apt_count DESC
    `;

    const { rows } = await db.query(query, [companyId]);
    res.json(rows);
  } catch (err) {
    console.error('Error en getCategoryStats:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas por categoría.' });
  }
}

/**
 * GET /api/recruitment/captacion/top-openings
 * Convocatorias más efectivas
 */
export async function getTopOpeningsCaptacion(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;

    const query = `
      SELECT 
        jo.id,
        jo.title,
        jo.location,
        jo.vacancies_count,
        jo.status,
        jc.name AS category_name,
        COUNT(DISTINCT jp.id) AS publications_count,
        COUNT(a.id) AS applications_count,
        COUNT(a.id) FILTER (WHERE a.prefilter_status = 'eligible') AS apt_count,
        COUNT(a.id) FILTER (WHERE a.current_stage = 'hired') AS hired_count,
        ROUND(COALESCE(AVG(a.prefilter_score) FILTER (WHERE a.application_status = 'submitted'), 0)::numeric, 1) AS avg_score
      FROM job_openings jo
      LEFT JOIN job_categories jc ON jo.category_id = jc.id
      LEFT JOIN job_publications jp ON jo.id = jp.job_opening_id
      LEFT JOIN applications a ON jo.id = a.job_opening_id
      WHERE jo.company_id = $1
      GROUP BY jo.id, jc.name
      ORDER BY apt_count DESC, applications_count DESC
      LIMIT 10
    `;

    const { rows } = await db.query(query, [companyId]);
    res.json(rows);
  } catch (err) {
    console.error('Error en getTopOpeningsCaptacion:', err);
    res.status(500).json({ error: 'Error al obtener mejores convocatorias.' });
  }
}
