import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import db from '../../../../db';
import { JobPublication, PublicationStatus } from '../../../../types';

// Helper para generar slug único de 8 caracteres alfanuméricos
function generateUniqueSlug(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

const publicationSchema = z.object({
  jobOpeningId: z.string().uuid(),
  campaignId: z.string().uuid().optional().nullable(),
  channelId: z.string().uuid().optional().nullable(),
  slug: z.string().min(3).max(30).optional(),
  title: z.string().min(5, 'El título de la publicación debe tener al menos 5 caracteres.'),
  description: z.string().optional(),
  bannerUrl: z.string().optional().nullable(),
  benefits: z.array(z.string()).default([]),
  closesAt: z.string().optional().nullable(),
  ogTitle: z.string().optional().nullable(),
  ogDescription: z.string().optional().nullable(),
  ogImageUrl: z.string().optional().nullable(),
});

/**
 * GET /api/recruitment/publications
 */
export async function getPublications(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { status, openingId, campaignId, channelId } = req.query;

    const conditions = ['jp.company_id = $1'];
    const params: any[] = [companyId];
    let idx = 2;

    if (status && status !== 'all') {
      conditions.push(`jp.status = $${idx++}`);
      params.push(status);
    }
    if (openingId) {
      conditions.push(`jp.job_opening_id = $${idx++}`);
      params.push(openingId);
    }
    if (campaignId) {
      conditions.push(`jp.campaign_id = $${idx++}`);
      params.push(campaignId);
    }
    if (channelId) {
      conditions.push(`jp.channel_id = $${idx++}`);
      params.push(channelId);
    }

    const query = `
      WITH pub_views AS (
        SELECT publication_id, COUNT(*) AS views, COUNT(DISTINCT ip_hash) FILTER (WHERE is_bot = FALSE) AS unique_views
        FROM publication_views
        WHERE company_id = $1
        GROUP BY publication_id
      ),
      pub_apps AS (
        SELECT 
          publication_id,
          COUNT(*) AS total_apps,
          COUNT(*) FILTER (WHERE application_status = 'submitted') AS completed_apps,
          COUNT(*) FILTER (WHERE prefilter_status = 'eligible') AS apt_apps,
          COUNT(*) FILTER (WHERE current_stage = 'hired') AS hired_apps
        FROM applications
        WHERE company_id = $1 AND publication_id IS NOT NULL
        GROUP BY publication_id
      )
      SELECT 
        jp.*,
        jo.title AS job_title,
        jo.location AS job_location,
        jo.vacancies_count AS job_vacancies,
        jo.salary_offered AS job_salary,
        jo.shift_type AS job_shift,
        jc.name AS category_name,
        camp.name AS campaign_name,
        chan.name AS channel_name,
        chan.type AS channel_type,
        COALESCE(pv.views, jp.views_total) AS calculated_views,
        COALESCE(pv.unique_views, jp.views_unique_estimated) AS calculated_unique_views,
        COALESCE(pa.total_apps, jp.applications_started) AS calculated_started,
        COALESCE(pa.completed_apps, jp.applications_completed) AS calculated_completed,
        COALESCE(pa.apt_apps, 0) AS apt_count,
        COALESCE(pa.hired_apps, 0) AS hired_count
      FROM job_publications jp
      JOIN job_openings jo ON jp.job_opening_id = jo.id
      LEFT JOIN job_categories jc ON jo.category_id = jc.id
      LEFT JOIN recruitment_campaigns camp ON jp.campaign_id = camp.id
      LEFT JOIN recruitment_channels chan ON jp.channel_id = chan.id
      LEFT JOIN pub_views pv ON pv.publication_id = jp.id
      LEFT JOIN pub_apps pa ON pa.publication_id = jp.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY jp.created_at DESC
    `;

    const { rows } = await db.query<JobPublication>(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error en getPublications:', err);
    res.status(500).json({ error: 'Error al obtener publicaciones.' });
  }
}

/**
 * GET /api/recruitment/publications/:id
 */
export async function getPublicationById(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const query = `
      SELECT 
        jp.*,
        jo.title AS job_title,
        jo.position_type AS job_position_type,
        jo.location AS job_location,
        jo.vacancies_count AS job_vacancies,
        jo.salary_offered AS job_salary,
        jo.shift_type AS job_shift,
        jo.requirements AS job_requirements,
        jo.description AS job_description,
        jc.name AS category_name,
        camp.name AS campaign_name,
        chan.name AS channel_name,
        chan.type AS channel_type
      FROM job_publications jp
      JOIN job_openings jo ON jp.job_opening_id = jo.id
      LEFT JOIN job_categories jc ON jo.category_id = jc.id
      LEFT JOIN recruitment_campaigns camp ON jp.campaign_id = camp.id
      LEFT JOIN recruitment_channels chan ON jp.channel_id = chan.id
      WHERE jp.id = $1 AND jp.company_id = $2
    `;

    const { rows } = await db.query<JobPublication>(query, [id, companyId]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Publicación no encontrada.' });
      return;
    }

    // Obtener los requisitos vigentes activos de la convocatoria asociada
    const reqsRes = await db.query(
      `SELECT * FROM opening_requirements 
       WHERE job_opening_id = $1 AND company_id = $2 AND is_active = TRUE
       ORDER BY order_index ASC`,
      [rows[0].job_opening_id, companyId]
    );

    res.json({
      publication: rows[0],
      activeRequirements: reqsRes.rows,
    });
  } catch (err) {
    console.error('Error en getPublicationById:', err);
    res.status(500).json({ error: 'Error al obtener publicación.' });
  }
}

/**
 * POST /api/recruitment/publications
 * Crear publicación desde Convocatoria o Centro de Captación
 */
export async function createPublication(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;

    const parsed = publicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos de publicación inválidos.', details: parsed.error.issues });
      return;
    }

    const d = parsed.data;

    // Verificar que la convocatoria exista y pertenezca a la empresa
    const openRes = await db.query<{ id: string; status: string; title: string }>(
      `SELECT id, status, title FROM job_openings WHERE id = $1 AND company_id = $2`,
      [d.jobOpeningId, companyId]
    );
    if (openRes.rows.length === 0) {
      res.status(404).json({ error: 'Convocatoria asociada no encontrada.' });
      return;
    }

    // Obtener la versión de requisitos vigente actual
    const verRes = await db.query<{ max_ver: number }>(
      `SELECT COALESCE(MAX(version), 1) AS max_ver FROM opening_requirements WHERE job_opening_id = $1 AND company_id = $2`,
      [d.jobOpeningId, companyId]
    );
    const reqVersion = verRes.rows[0].max_ver;

    // Generar o validar slug único
    let finalSlug = d.slug ? d.slug.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') : generateUniqueSlug();
    if (!finalSlug || finalSlug.length < 3) finalSlug = generateUniqueSlug();

    // Comprobar unicidad global
    let exists = await db.query(`SELECT id FROM job_publications WHERE slug = $1`, [finalSlug]);
    let attempts = 0;
    while (exists.rows.length > 0 && attempts < 5) {
      finalSlug = generateUniqueSlug();
      exists = await db.query(`SELECT id FROM job_publications WHERE slug = $1`, [finalSlug]);
      attempts++;
    }

    const { rows } = await db.query<JobPublication>(
      `INSERT INTO job_publications (
         company_id, job_opening_id, campaign_id, channel_id, slug,
         title, description, banner_url, benefits, requirement_version_at_publish,
         status, closes_at, og_title, og_description, og_image_url, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        companyId,
        d.jobOpeningId,
        d.campaignId || null,
        d.channelId || null,
        finalSlug,
        d.title,
        d.description || null,
        d.bannerUrl || null,
        JSON.stringify(d.benefits || []),
        reqVersion,
        d.closesAt || null,
        d.ogTitle || d.title,
        d.ogDescription || d.description?.slice(0, 200) || null,
        d.ogImageUrl || d.bannerUrl || null,
        userId,
      ]
    );

    await db.query(
      `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
       VALUES ($1, $2, 'publication_created', 'job_publications', $3, $4)`,
      [companyId, userId, rows[0].id, JSON.stringify({ slug: finalSlug, title: d.title })]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error en createPublication:', err);
    res.status(500).json({ error: 'Error al crear publicación.' });
  }
}

/**
 * PUT /api/recruitment/publications/:id
 * Editar publicación (solo modifica presentación, jamás reglas de evaluación)
 */
export async function updatePublication(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { id } = req.params;

    const parsed = publicationSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos.', details: parsed.error.issues });
      return;
    }

    const d = parsed.data;
    const { rows } = await db.query<JobPublication>(
      `UPDATE job_publications
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           banner_url = COALESCE($3, banner_url),
           benefits = COALESCE($4, benefits),
           campaign_id = COALESCE($5, campaign_id),
           channel_id = COALESCE($6, channel_id),
           closes_at = COALESCE($7, closes_at),
           og_title = COALESCE($8, og_title),
           og_description = COALESCE($9, og_description),
           og_image_url = COALESCE($10, og_image_url),
           updated_at = NOW()
       WHERE id = $11 AND company_id = $12
       RETURNING *`,
      [
        d.title,
        d.description,
        d.bannerUrl,
        d.benefits ? JSON.stringify(d.benefits) : null,
        d.campaignId,
        d.channelId,
        d.closesAt,
        d.ogTitle,
        d.ogDescription,
        d.ogImageUrl,
        id,
        companyId,
      ]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Publicación no encontrada.' });
      return;
    }

    await db.query(
      `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
       VALUES ($1, $2, 'publication_updated', 'job_publications', $3, $4)`,
      [companyId, userId, id, JSON.stringify({ title: rows[0].title })]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Error en updatePublication:', err);
    res.status(500).json({ error: 'Error al actualizar publicación.' });
  }
}

/**
 * POST /api/recruitment/publications/:id/status
 * Transición de estado con validación estricta de la máquina de estados
 */
export async function changePublicationStatus(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { id } = req.params;
    const { status: targetStatus } = req.body;

    const validStatuses: PublicationStatus[] = ['draft', 'published', 'paused', 'closed', 'archived'];
    if (!validStatuses.includes(targetStatus)) {
      res.status(400).json({ error: 'Estado objetivo no válido.' });
      return;
    }

    const currentRes = await db.query<JobPublication & { opening_status: string }>(
      `SELECT jp.*, jo.status AS opening_status 
       FROM job_publications jp
       JOIN job_openings jo ON jp.job_opening_id = jo.id
       WHERE jp.id = $1 AND jp.company_id = $2`,
      [id, companyId]
    );

    if (currentRes.rows.length === 0) {
      res.status(404).json({ error: 'Publicación no encontrada.' });
      return;
    }

    const pub = currentRes.rows[0];
    const currentStatus = pub.status;

    // Validación de la máquina de estados
    let allowed = false;

    if (currentStatus === 'draft' && targetStatus === 'published') {
      if (pub.opening_status === 'cancelled') {
        res.status(400).json({ error: 'No se puede publicar una convocatoria cancelada.' });
        return;
      }
      allowed = true;
    } else if (currentStatus === 'published' && targetStatus === 'paused') {
      allowed = true;
    } else if (currentStatus === 'paused' && targetStatus === 'published') {
      allowed = true;
    } else if ((currentStatus === 'published' || currentStatus === 'paused') && targetStatus === 'closed') {
      allowed = true;
    } else if (currentStatus === 'closed' && targetStatus === 'archived') {
      allowed = true;
    } else if (currentStatus === targetStatus) {
      res.json(pub);
      return;
    }

    if (!allowed) {
      res.status(400).json({
        error: `Transición de estado inválida: no se permite cambiar de '${currentStatus}' a '${targetStatus}'.`,
      });
      return;
    }

    // Campos de timestamp según estado
    let publishedAtSql = 'published_at = published_at';
    let pausedAtSql = 'paused_at = paused_at';
    let closedAtSql = 'closed_at = closed_at';
    let archivedAtSql = 'archived_at = archived_at';

    if (targetStatus === 'published' && !pub.published_at) {
      publishedAtSql = 'published_at = NOW()';
    }
    if (targetStatus === 'paused') {
      pausedAtSql = 'paused_at = NOW()';
    }
    if (targetStatus === 'closed') {
      closedAtSql = 'closed_at = NOW()';
    }
    if (targetStatus === 'archived') {
      archivedAtSql = 'archived_at = NOW()';
    }

    const { rows } = await db.query<JobPublication>(
      `UPDATE job_publications
       SET status = $1,
           ${publishedAtSql},
           ${pausedAtSql},
           ${closedAtSql},
           ${archivedAtSql},
           updated_at = NOW()
       WHERE id = $2 AND company_id = $3
       RETURNING *`,
      [targetStatus, id, companyId]
    );

    await db.query(
      `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
       VALUES ($1, $2, 'publication_status_changed', 'job_publications', $3, $4)`,
      [companyId, userId, id, JSON.stringify({ from: currentStatus, to: targetStatus })]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Error en changePublicationStatus:', err);
    res.status(500).json({ error: 'Error al cambiar estado de la publicación.' });
  }
}

/**
 * POST /api/recruitment/publications/:id/duplicate
 * Duplica publicación (estructura, portada, beneficios) pero NO postulantes ni métricas
 */
export async function duplicatePublication(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { id } = req.params;
    const { targetJobOpeningId, newTitle } = req.body;

    const origRes = await db.query<JobPublication>(
      `SELECT * FROM job_publications WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );

    if (origRes.rows.length === 0) {
      res.status(404).json({ error: 'Publicación original no encontrada.' });
      return;
    }

    const orig = origRes.rows[0];
    const finalOpeningId = targetJobOpeningId || orig.job_opening_id;
    const finalTitle = newTitle || `${orig.title} — Copia`;
    const newSlug = generateUniqueSlug();

    // Obtener versión vigente de la convocatoria objetivo
    const verRes = await db.query<{ max_ver: number }>(
      `SELECT COALESCE(MAX(version), 1) AS max_ver FROM opening_requirements WHERE job_opening_id = $1 AND company_id = $2`,
      [finalOpeningId, companyId]
    );
    const reqVersion = verRes.rows[0].max_ver;

    const { rows } = await db.query<JobPublication>(
      `INSERT INTO job_publications (
         company_id, job_opening_id, campaign_id, channel_id, slug,
         title, description, banner_url, benefits, requirement_version_at_publish,
         status, closes_at, og_title, og_description, og_image_url, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        companyId,
        finalOpeningId,
        orig.campaign_id,
        orig.channel_id,
        newSlug,
        finalTitle,
        orig.description,
        orig.banner_url,
        JSON.stringify(orig.benefits || []),
        reqVersion,
        orig.closes_at,
        orig.og_title ? `${orig.og_title} (Copia)` : finalTitle,
        orig.og_description,
        orig.og_image_url,
        userId,
      ]
    );

    await db.query(
      `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
       VALUES ($1, $2, 'publication_duplicated', 'job_publications', $3, $4)`,
      [companyId, userId, rows[0].id, JSON.stringify({ originalId: id, newSlug })]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error en duplicatePublication:', err);
    res.status(500).json({ error: 'Error al duplicar publicación.' });
  }
}

/**
 * DELETE /api/recruitment/publications/:id
 * Solo permite eliminar si está en borrador y tiene 0 postulaciones
 */
export async function deletePublication(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { id } = req.params;

    // Verificar si ya tiene postulaciones
    const appsCountRes = await db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM applications WHERE publication_id = $1 AND company_id = $2`,
      [id, companyId]
    );
    const count = parseInt(appsCountRes.rows[0].count, 10);

    if (count > 0) {
      res.status(400).json({
        error: `No se puede eliminar la publicación porque ya generó ${count} postulación(es). Puede cerrarla o archivarla para preservar el historial.`,
      });
      return;
    }

    const { rows } = await db.query<JobPublication>(
      `DELETE FROM job_publications WHERE id = $1 AND company_id = $2 RETURNING *`,
      [id, companyId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Publicación no encontrada.' });
      return;
    }

    await db.query(
      `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
       VALUES ($1, $2, 'publication_deleted', 'job_publications', $3, $4)`,
      [companyId, userId, id, JSON.stringify({ slug: rows[0].slug })]
    );

    res.json({ message: 'Publicación eliminada correctamente.' });
  } catch (err) {
    console.error('Error en deletePublication:', err);
    res.status(500).json({ error: 'Error al eliminar publicación.' });
  }
}

/**
 * GET /api/recruitment/publications/:id/metrics
 * Métricas detalladas con embudo por canal y serie temporal diaria
 */
export async function getPublicationMetrics(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    // 1. Resumen global de la publicación
    const summaryQuery = `
      WITH pub_views AS (
        SELECT 
          COUNT(*) AS total_views,
          COUNT(DISTINCT ip_hash) FILTER (WHERE is_bot = FALSE) AS unique_views,
          COUNT(*) FILTER (WHERE is_bot = TRUE) AS bot_views,
          COUNT(*) FILTER (WHERE user_agent_type = 'mobile') AS mobile_views,
          COUNT(*) FILTER (WHERE user_agent_type = 'desktop') AS desktop_views
        FROM publication_views
        WHERE publication_id = $1 AND company_id = $2
      ),
      pub_apps AS (
        SELECT 
          COUNT(*) AS started_count,
          COUNT(*) FILTER (WHERE application_status = 'submitted') AS completed_count,
          COUNT(*) FILTER (WHERE prefilter_status = 'eligible') AS apt_count,
          COUNT(*) FILTER (WHERE prefilter_status = 'review') AS review_count,
          COUNT(*) FILTER (WHERE prefilter_status = 'ineligible') AS ineligible_count,
          COUNT(*) FILTER (WHERE current_stage = 'interview') AS interviewed_count,
          COUNT(*) FILTER (WHERE current_stage = 'hired') AS hired_count,
          AVG(prefilter_score) FILTER (WHERE application_status = 'submitted') AS avg_score
        FROM applications
        WHERE publication_id = $1 AND company_id = $2
      )
      SELECT 
        jp.id, jp.slug, jp.title, jp.status, jp.published_at, jp.closes_at,
        COALESCE(pv.total_views, 0) AS total_views,
        COALESCE(pv.unique_views, 0) AS unique_views,
        COALESCE(pv.bot_views, 0) AS bot_views,
        COALESCE(pv.mobile_views, 0) AS mobile_views,
        COALESCE(pv.desktop_views, 0) AS desktop_views,
        COALESCE(pa.started_count, 0) AS started_count,
        COALESCE(pa.completed_count, 0) AS completed_count,
        COALESCE(pa.apt_count, 0) AS apt_count,
        COALESCE(pa.review_count, 0) AS review_count,
        COALESCE(pa.ineligible_count, 0) AS ineligible_count,
        COALESCE(pa.interviewed_count, 0) AS interviewed_count,
        COALESCE(pa.hired_count, 0) AS hired_count,
        ROUND(COALESCE(pa.avg_score, 0)::numeric, 1) AS avg_score
      FROM job_publications jp
      LEFT JOIN pub_views pv ON TRUE
      LEFT JOIN pub_apps pa ON TRUE
      WHERE jp.id = $1 AND jp.company_id = $2
    `;

    const summaryRes = await db.query(summaryQuery, [id, companyId]);
    if (summaryRes.rows.length === 0) {
      res.status(404).json({ error: 'Publicación no encontrada.' });
      return;
    }

    // 2. Desglose por canal para esta publicación
    const channelsQuery = `
      WITH channel_views AS (
        SELECT channel_id, COUNT(*) AS views, COUNT(DISTINCT ip_hash) FILTER (WHERE is_bot = FALSE) AS unique_views
        FROM publication_views
        WHERE publication_id = $1 AND company_id = $2
        GROUP BY channel_id
      ),
      channel_apps AS (
        SELECT 
          channel_id,
          COUNT(*) AS total_apps,
          COUNT(*) FILTER (WHERE application_status = 'submitted') AS completed_apps,
          COUNT(*) FILTER (WHERE prefilter_status = 'eligible') AS apt_apps,
          COUNT(*) FILTER (WHERE current_stage = 'hired') AS hired_apps
        FROM applications
        WHERE publication_id = $1 AND company_id = $2
        GROUP BY channel_id
      )
      SELECT 
        COALESCE(rc.id::text, 'direct') AS channel_id,
        COALESCE(rc.name, 'Acceso Directo / Sin Canal') AS channel_name,
        COALESCE(rc.type, 'web') AS channel_type,
        COALESCE(cv.views, 0) AS views,
        COALESCE(cv.unique_views, 0) AS unique_views,
        COALESCE(ca.total_apps, 0) AS started,
        COALESCE(ca.completed_apps, 0) AS completed,
        COALESCE(ca.apt_apps, 0) AS apt,
        COALESCE(ca.hired_apps, 0) AS hired,
        CASE WHEN COALESCE(ca.completed_apps, 0) > 0 
          THEN ROUND(COALESCE(ca.apt_apps, 0)::numeric / ca.completed_apps * 100, 1) 
          ELSE 0 
        END AS quality_rate_pct
      FROM (SELECT DISTINCT channel_id FROM publication_views WHERE publication_id = $1
            UNION 
            SELECT DISTINCT channel_id FROM applications WHERE publication_id = $1) active_chans
      LEFT JOIN recruitment_channels rc ON active_chans.channel_id = rc.id
      LEFT JOIN channel_views cv ON cv.channel_id = rc.id
      LEFT JOIN channel_apps ca ON ca.channel_id = rc.id
      ORDER BY COALESCE(ca.apt_apps, 0) DESC
    `;

    const channelsRes = await db.query(channelsQuery, [id, companyId]);

    // 3. Serie temporal de vistas y postulaciones en los últimos 14 días
    const timelineQuery = `
      WITH dates AS (
        SELECT generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day'::interval)::date AS day
      ),
      daily_views AS (
        SELECT viewed_at::date AS day, COUNT(*) AS views, COUNT(DISTINCT ip_hash) FILTER (WHERE is_bot = FALSE) AS unique_views
        FROM publication_views
        WHERE publication_id = $1 AND viewed_at >= CURRENT_DATE - INTERVAL '13 days'
        GROUP BY viewed_at::date
      ),
      daily_apps AS (
        SELECT created_at::date AS day, COUNT(*) AS apps, COUNT(*) FILTER (WHERE prefilter_status = 'eligible') AS apt
        FROM applications
        WHERE publication_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '13 days'
        GROUP BY created_at::date
      )
      SELECT 
        to_char(d.day, 'YYYY-MM-DD') AS date_str,
        COALESCE(dv.views, 0) AS views,
        COALESCE(dv.unique_views, 0) AS unique_views,
        COALESCE(da.apps, 0) AS applications,
        COALESCE(da.apt, 0) AS apt
      FROM dates d
      LEFT JOIN daily_views dv ON d.day = dv.day
      LEFT JOIN daily_apps da ON d.day = da.day
      ORDER BY d.day ASC
    `;

    const timelineRes = await db.query(timelineQuery, [id]);

    res.json({
      summary: summaryRes.rows[0],
      channelsBreakdown: channelsRes.rows,
      timeline: timelineRes.rows,
    });
  } catch (err) {
    console.error('Error en getPublicationMetrics:', err);
    res.status(500).json({ error: 'Error al obtener métricas de publicación.' });
  }
}
