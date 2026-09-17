import { Request, Response } from 'express';
import db from '../../../../db';

/**
 * GET /api/admin/audit
 * Logs de auditoría filtrados por empresa autenticada.
 */
export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;

    const action = req.query.action as string | undefined;
    const userId = req.query.userId as string | undefined;
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;

    const conditions: string[] = ['al.company_id = $1'];
    const params: unknown[] = [companyId];
    let idx = 2;

    if (action) { conditions.push(`al.action = $${idx++}`); params.push(action); }
    if (userId) { conditions.push(`al.user_id = $${idx++}`); params.push(userId); }
    if (dateFrom) { conditions.push(`al.created_at >= $${idx++}`); params.push(dateFrom); }
    if (dateTo) { conditions.push(`al.created_at <= $${idx++}`); params.push(dateTo); }

    const where = conditions.join(' AND ');

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM audit_logs al WHERE ${where}`,
      params
    );

    const { rows } = await db.query(
      `SELECT al.id, al.action, al.resource, al.resource_id, al.details,
              al.ip_address, al.success, al.error_message, al.created_at,
              u.username, u.full_name AS user_full_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE ${where}
       ORDER BY al.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
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
    console.error('Error en getAuditLogs:', err);
    res.status(500).json({ error: 'Error al obtener logs de auditoría.' });
  }
}
