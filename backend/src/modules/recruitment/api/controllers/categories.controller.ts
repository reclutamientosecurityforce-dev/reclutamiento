import { Request, Response } from 'express';
import { z } from 'zod';
import db from '../../../../db';
import { JobCategory } from '../../../../types';

// Helper para generar slug a partir del nombre
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

const categorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  slug: z.string().optional(),
  icon: z.string().default('Shield'),
  colorHex: z.string().default('#2563eb'),
  description: z.string().optional(),
  templateRequirements: z.array(z.any()).default([]),
  isActive: z.boolean().default(true),
  orderIndex: z.number().default(0),
});

/**
 * GET /api/recruitment/categories
 * Listar categorías de la empresa con métricas de convocatorias y publicaciones
 */
export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const includeInactive = req.query.includeInactive === 'true';

    let query = `
      SELECT 
        jc.*,
        COUNT(DISTINCT jo.id) AS openings_count,
        COUNT(DISTINCT jp.id) FILTER (WHERE jp.status = 'published') AS active_publications_count
      FROM job_categories jc
      LEFT JOIN job_openings jo ON jc.id = jo.category_id AND jo.company_id = jc.company_id
      LEFT JOIN job_publications jp ON jo.id = jp.job_opening_id AND jp.company_id = jc.company_id
      WHERE jc.company_id = $1
    `;

    const params: any[] = [companyId];
    if (!includeInactive) {
      query += ` AND jc.is_active = TRUE`;
    }

    query += ` GROUP BY jc.id ORDER BY jc.order_index ASC, jc.name ASC`;

    const { rows } = await db.query<JobCategory>(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error en getCategories:', err);
    res.status(500).json({ error: 'Error al obtener categorías.' });
  }
}

/**
 * GET /api/recruitment/categories/:id
 */
export async function getCategoryById(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const { rows } = await db.query<JobCategory>(
      `SELECT * FROM job_categories WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Categoría no encontrada.' });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error en getCategoryById:', err);
    res.status(500).json({ error: 'Error al obtener categoría.' });
  }
}

/**
 * POST /api/recruitment/categories
 */
export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;

    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos de categoría inválidos.', details: parsed.error.issues });
      return;
    }

    const d = parsed.data;
    let finalSlug = d.slug ? slugify(d.slug) : slugify(d.name);

    // Evitar colisión de slug en la misma empresa
    const slugCheck = await db.query(
      `SELECT id FROM job_categories WHERE company_id = $1 AND slug = $2`,
      [companyId, finalSlug]
    );
    if (slugCheck.rows.length > 0) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const { rows } = await db.query<JobCategory>(
      `INSERT INTO job_categories (
         company_id, name, slug, icon, color_hex, description,
         template_requirements, is_active, order_index, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        companyId,
        d.name,
        finalSlug,
        d.icon,
        d.colorHex,
        d.description || null,
        JSON.stringify(d.templateRequirements || []),
        d.isActive,
        d.orderIndex,
        userId,
      ]
    );

    await db.query(
      `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
       VALUES ($1, $2, 'category_created', 'job_categories', $3, $4)`,
      [companyId, userId, rows[0].id, JSON.stringify({ name: d.name, slug: finalSlug })]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error en createCategory:', err);
    res.status(500).json({ error: 'Error al crear categoría.' });
  }
}

/**
 * PUT /api/recruitment/categories/:id
 */
export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { id } = req.params;

    const parsed = categorySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos.', details: parsed.error.issues });
      return;
    }

    const d = parsed.data;
    const { rows } = await db.query<JobCategory>(
      `UPDATE job_categories
       SET name = COALESCE($1, name),
           icon = COALESCE($2, icon),
           color_hex = COALESCE($3, color_hex),
           description = COALESCE($4, description),
           template_requirements = COALESCE($5, template_requirements),
           is_active = COALESCE($6, is_active),
           order_index = COALESCE($7, order_index),
           updated_at = NOW()
       WHERE id = $8 AND company_id = $9
       RETURNING *`,
      [
        d.name,
        d.icon,
        d.colorHex,
        d.description,
        d.templateRequirements ? JSON.stringify(d.templateRequirements) : null,
        d.isActive,
        d.orderIndex,
        id,
        companyId,
      ]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Categoría no encontrada.' });
      return;
    }

    await db.query(
      `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
       VALUES ($1, $2, 'category_updated', 'job_categories', $3, $4)`,
      [companyId, userId, id, JSON.stringify({ name: rows[0].name })]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Error en updateCategory:', err);
    res.status(500).json({ error: 'Error al actualizar categoría.' });
  }
}

/**
 * PATCH /api/recruitment/categories/:id/toggle
 */
export async function toggleCategoryStatus(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { id } = req.params;

    const { rows } = await db.query<JobCategory>(
      `UPDATE job_categories
       SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 AND company_id = $2
       RETURNING *`,
      [id, companyId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Categoría no encontrada.' });
      return;
    }

    await db.query(
      `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details)
       VALUES ($1, $2, 'category_status_toggled', 'job_categories', $3, $4)`,
      [companyId, userId, id, JSON.stringify({ is_active: rows[0].is_active })]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Error en toggleCategoryStatus:', err);
    res.status(500).json({ error: 'Error al cambiar estado de la categoría.' });
  }
}
