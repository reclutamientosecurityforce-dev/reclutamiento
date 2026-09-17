import { Request, Response } from 'express';
import db from '../../../../db';

/**
 * GET /api/admin/sessions
 * Lista sesiones activas de la empresa.
 */
export async function getSessions(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const activeOnly = req.query.active !== 'false';

    const conditions = ['s.company_id = $1'];
    if (activeOnly) conditions.push('s.is_active = TRUE AND s.expires_at > NOW()');

    const where = conditions.join(' AND ');

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM sessions s WHERE ${where}`,
      [companyId]
    );

    const { rows } = await db.query(
      `SELECT s.id, s.user_id, s.is_active, s.ip_address, s.user_agent,
              s.expires_at, s.created_at, s.last_seen_at,
              u.username, u.full_name, u.email
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE ${where}
       ORDER BY s.last_seen_at DESC
       LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    );

    res.json({
      data: rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (err) {
    console.error('Error en getSessions:', err);
    res.status(500).json({ error: 'Error al obtener sesiones.' });
  }
}

/**
 * DELETE /api/admin/sessions/:id
 * Cierra una sesión remotamente (solo admin, dentro de su empresa).
 */
export async function terminateSession(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const { rowCount } = await db.query(
      `UPDATE sessions SET is_active = FALSE
       WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );

    if (rowCount === 0) {
      res.status(404).json({ error: 'Sesión no encontrada.' });
      return;
    }

    await db.query(
      `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, ip_address, success)
       VALUES ($1, $2, 'session_terminated', 'sessions', $3, $4::inet, TRUE)`,
      [companyId, req.user!.id, id, req.ip]
    );

    res.json({ message: 'Sesión terminada exitosamente.' });
  } catch (err) {
    console.error('Error en terminateSession:', err);
    res.status(500).json({ error: 'Error al terminar la sesión.' });
  }
}
