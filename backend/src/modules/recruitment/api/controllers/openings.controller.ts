import { Request, Response } from 'express';
import { z } from 'zod';
import db from '../../../../db';
import { JobOpening } from '../../../../types';

const openingSchema = z.object({
  categoryId: z.string().uuid().optional().nullable(),
  title: z.string().min(3),
  positionType: z.string().min(2),
  location: z.string().min(2),
  clientName: z.string().optional().nullable(),
  vacanciesCount: z.number().int().positive(),
  salaryOffered: z.number().positive().optional().nullable(),
  shiftType: z.string().default('12x12 Rotativo'),
  status: z.enum(['open', 'in_progress', 'filled', 'cancelled']).default('open'),
  requirements: z.object({
    minHeight: z.number().optional(),
    sucamecRequired: z.boolean().optional(),
    licenseRequired: z.boolean().optional(),
    experienceYears: z.number().optional(),
  }).optional(),
  description: z.string().optional().nullable(),
  createFromCategoryTemplate: z.boolean().optional(),
});

/**
 * GET /api/recruitment/openings
 */
export async function getOpenings(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const status = req.query.status as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;

    const conditions = ['jo.company_id = $1'];
    const params: unknown[] = [companyId];
    let idx = 2;

    if (status && status !== 'all') {
      conditions.push(`jo.status = $${idx++}`);
      params.push(status);
    }

    if (categoryId && categoryId !== 'all') {
      conditions.push(`jo.category_id = $${idx++}`);
      params.push(categoryId);
    }

    const { rows } = await db.query<JobOpening>(
      `SELECT 
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
       ORDER BY jo.created_at DESC`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error('Error en getOpenings:', err);
    res.status(500).json({ error: 'Error al obtener convocatorias.' });
  }
}

/**
 * POST /api/recruitment/openings
 */
export async function createOpening(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;

    const parsed = openingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos de convocatoria inválidos.', details: parsed.error.issues });
      return;
    }

    const d = parsed.data;

    const result = await db.transaction(async (client) => {
      // 1. Insertar convocatoria
      const { rows } = await client.query<JobOpening>(
        `INSERT INTO job_openings (
           company_id, category_id, title, position_type, location, client_name,
           vacancies_count, salary_offered, shift_type, status,
           requirements, description, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
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
        ]
      );

      const opening = rows[0];

      // 2. Si se solicitó crear desde plantilla de categoría, cargar requisitos iniciales
      if (d.categoryId && d.createFromCategoryTemplate) {
        const catRes = await client.query<{ template_requirements: any[] }>(
          `SELECT template_requirements FROM job_categories WHERE id = $1 AND company_id = $2`,
          [d.categoryId, companyId]
        );

        if (catRes.rows.length > 0 && Array.isArray(catRes.rows[0].template_requirements)) {
          const tpl = catRes.rows[0].template_requirements;
          for (let i = 0; i < tpl.length; i++) {
            const reqItem = tpl[i];
            await client.query(
              `INSERT INTO opening_requirements (
                 company_id, job_opening_id, version, code, title, description,
                 requirement_type, rule_type, rule_config, weight_score,
                 required_document_type, order_index, is_active
               ) VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)`,
              [
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
              ]
            );
          }
        }
      }

      // 3. Auditoría
      await client.query(
        `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details, ip_address, success)
         VALUES ($1, $2, 'opening_created', 'job_openings', $3, $4, $5::inet, TRUE)`,
        [companyId, userId, opening.id, JSON.stringify({ title: d.title, vacancies: d.vacanciesCount, categoryId: d.categoryId }), req.ip]
      );

      return opening;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Error en createOpening:', err);
    res.status(500).json({ error: 'Error al crear convocatoria.' });
  }
}

/**
 * PUT /api/recruitment/openings/:id
 */
export async function updateOpening(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const parsed = openingSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos.', details: parsed.error.issues });
      return;
    }

    const d = parsed.data;
    const { rows } = await db.query<JobOpening>(
      `UPDATE job_openings
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
       RETURNING *`,
      [
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
      ]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Convocatoria no encontrada.' });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error en updateOpening:', err);
    res.status(500).json({ error: 'Error al actualizar convocatoria.' });
  }
}

/**
 * GET /api/recruitment/companies/contact
 */
export async function getCompanyContact(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { rows } = await db.query(
      `SELECT name, address, phone, email, whatsapp, facebook_url, instagram_url, linkedin_url, hours
       FROM companies 
       WHERE id = $1`,
      [companyId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Empresa no encontrada.' });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error en getCompanyContact:', err);
    res.status(500).json({ error: 'Error al obtener información de contacto.' });
  }
}

/**
 * PUT /api/recruitment/companies/contact
 */
export async function updateCompanyContact(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { phone, whatsapp, email, facebook_url, instagram_url, linkedin_url, hours, address } = req.body;

    const { rows } = await db.query(
      `UPDATE companies 
       SET phone = $1,
           whatsapp = $2,
           email = $3,
           facebook_url = $4,
           instagram_url = $5,
           linkedin_url = $6,
           hours = $7,
           address = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        phone ?? null,
        whatsapp ?? null,
        email ?? null,
        facebook_url ?? null,
        instagram_url ?? null,
        linkedin_url ?? null,
        hours ?? null,
        address ?? null,
        companyId,
      ]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Empresa no encontrada.' });
      return;
    }

    res.json({ message: 'Información de contacto actualizada correctamente.', company: rows[0] });
  } catch (err) {
    console.error('Error en updateCompanyContact:', err);
    res.status(500).json({ error: 'Error al actualizar información de contacto.' });
  }
}

