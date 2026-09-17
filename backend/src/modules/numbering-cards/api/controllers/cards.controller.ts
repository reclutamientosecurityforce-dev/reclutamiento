import { Request, Response } from 'express';
import { z } from 'zod';
import { PoolClient } from 'pg';
import db from '../../../../db';
import { PaginatedResponse, Card } from '../../../../types';

const useCardSchema = z.object({
  observations: z.string().max(500).optional(),
});

const correctCardSchema = z.object({
  correctionReason: z.string().min(1).max(500),
  newStatus: z.enum(['available', 'cancelled']),
  observations: z.string().max(500).optional(),
});

/**
 * GET /api/cards/summary
 * Resumen ejecutivo mediante consultas agregadas (NO SELECT * FROM cards).
 * Usado por el Dashboard administrativo y de usuario.
 */
export async function getCardsSummary(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId; // siempre del contexto autenticado

    const { rows } = await db.query<{
      total: string; available: string; used: string;
      reserved: string; cancelled: string;
    }>(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'available') AS available,
         COUNT(*) FILTER (WHERE status = 'used')      AS used,
         COUNT(*) FILTER (WHERE status = 'reserved')  AS reserved,
         COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
       FROM cards
       WHERE company_id = $1`,
      [companyId]
    );

    const sessionsResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM sessions
       WHERE company_id = $1 AND is_active = TRUE AND expires_at > NOW()`,
      [companyId]
    );

    const total = parseInt(rows[0].total) || 0;
    const used = parseInt(rows[0].used) || 0;
    const available = parseInt(rows[0].available) || 0;
    const activeSessions = parseInt(sessionsResult.rows[0].count) || 0;

    res.json({
      total,
      available,
      used,
      reserved: parseInt(rows[0].reserved) || 0,
      cancelled: parseInt(rows[0].cancelled) || 0,
      activeSessions,
      usedPercentage: total > 0 ? Math.round((used / total) * 100) : 0,
      availablePercentage: total > 0 ? Math.round((available / total) * 100) : 0,
    });
  } catch (err) {
    console.error('Error en getCardsSummary:', err);
    res.status(500).json({ error: 'Error al obtener resumen de cartas.' });
  }
}

/**
 * GET /api/cards
 * Lista paginada de cartas (NO envía todas al frontend).
 * Parámetros: page, limit, status, number (búsqueda exacta), search
 */
export async function getCards(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;

    // Parámetros de paginación (máximo 200 por página)
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(200, Math.max(10, parseInt(req.query.limit as string) || 50));
    const offset = (page - 1) * limit;

    // Filtros
    const status = req.query.status as string | undefined;
    const exactNumber = req.query.number as string | undefined;
    const search = req.query.search as string | undefined;

    // Si busca un número exacto, devuelve solo esa carta
    if (exactNumber && /^\d+$/.test(exactNumber)) {
      const { rows } = await db.query<Card>(
        `SELECT c.*, 
                u1.full_name AS used_by_name,
                u2.full_name AS reserved_by_name
         FROM cards c
         LEFT JOIN users u1 ON c.used_by = u1.id
         LEFT JOIN users u2 ON c.reserved_by = u2.id
         WHERE c.company_id = $1 AND c.number = $2`,
        [companyId, parseInt(exactNumber)]
      );

      res.json({
        data: rows,
        pagination: {
          total: rows.length,
          page: 1,
          limit,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      } as PaginatedResponse<Card>);
      return;
    }

    // Construcción dinámica del WHERE
    const conditions: string[] = ['c.company_id = $1'];
    const params: unknown[] = [companyId];
    let paramIdx = 2;

    if (status) {
      conditions.push(`c.status = $${paramIdx++}`);
      params.push(status);
    }

    if (search && /^\d+$/.test(search)) {
      // Búsqueda por rango de número
      const num = parseInt(search);
      conditions.push(`c.number BETWEEN $${paramIdx} AND $${paramIdx + 1}`);
      params.push(Math.max(1, num - 10), num + 10);
      paramIdx += 2;
    }

    const where = conditions.join(' AND ');

    // Contar total
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM cards c WHERE ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Obtener página
    const { rows } = await db.query<Card>(
      `SELECT c.id, c.number, c.status, c.used_by, c.used_at,
              c.reserved_by, c.reserved_at, c.reservation_expires_at,
              c.cancelled_by, c.cancelled_at, c.observations, c.updated_at,
              u1.full_name AS used_by_name,
              u2.full_name AS reserved_by_name
       FROM cards c
       LEFT JOIN users u1 ON c.used_by = u1.id
       LEFT JOIN users u2 ON c.reserved_by = u2.id
       WHERE ${where}
       ORDER BY c.number ASC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    res.json({
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
    } as PaginatedResponse<Card>);
  } catch (err) {
    console.error('Error en getCards:', err);
    res.status(500).json({ error: 'Error al obtener cartas.' });
  }
}

/**
 * GET /api/cards/:id
 * Detalle de una carta específica.
 */
export async function getCard(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const { rows } = await db.query<Card>(
      `SELECT c.*,
              u1.full_name AS used_by_name,
              u2.full_name AS reserved_by_name,
              u3.full_name AS cancelled_by_name,
              u4.full_name AS corrected_by_name
       FROM cards c
       LEFT JOIN users u1 ON c.used_by = u1.id
       LEFT JOIN users u2 ON c.reserved_by = u2.id
       LEFT JOIN users u3 ON c.cancelled_by = u3.id
       LEFT JOIN users u4 ON c.corrected_by = u4.id
       WHERE c.id = $1 AND c.company_id = $2`,
      [id, companyId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Carta no encontrada.' });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error en getCard:', err);
    res.status(500).json({ error: 'Error al obtener carta.' });
  }
}

/**
 * GET /api/cards/:id/history
 * Historial completo de una carta (trazabilidad).
 */
export async function getCardHistory(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    // Verificar que la carta pertenece a la empresa
    const cardCheck = await db.query(
      'SELECT id FROM cards WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    if (cardCheck.rows.length === 0) {
      res.status(404).json({ error: 'Carta no encontrada.' });
      return;
    }

    const { rows } = await db.query(
      `SELECT ch.*, u.full_name AS user_full_name, u.username
       FROM card_history ch
       LEFT JOIN users u ON ch.user_id = u.id
       WHERE ch.card_id = $1 AND ch.company_id = $2
       ORDER BY ch.created_at DESC`,
      [id, companyId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error en getCardHistory:', err);
    res.status(500).json({ error: 'Error al obtener historial de carta.' });
  }
}

/**
 * POST /api/cards/:id/use
 * ═══════════════════════════════════════════════════════════════════
 * LÓGICA CRÍTICA DE CONCURRENCIA
 * Garantiza: UNA NUMERACIÓN — UNA UTILIZACIÓN — UN RESPONSABLE
 *
 * Transacción PostgreSQL con SELECT FOR UPDATE:
 *   BEGIN
 *   SELECT ... FOR UPDATE          ← bloqueo exclusivo de la fila
 *   verificar estado = 'available'
 *   UPDATE cards SET status = 'used'
 *   INSERT card_history
 *   INSERT audit_logs
 *   COMMIT
 * ═══════════════════════════════════════════════════════════════════
 */
export async function useCard(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { id } = req.params;

    const parsed = useCardSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos.', details: parsed.error.issues });
      return;
    }

    const { observations } = parsed.data;

    const result = await db.transaction(async (client: PoolClient) => {
      // SELECT FOR UPDATE — bloqueo exclusivo de la fila
      const { rows } = await client.query<{
        id: string; number: number; status: string; company_id: string;
      }>(
        `SELECT id, number, status, company_id
         FROM cards
         WHERE id = $1 AND company_id = $2
         FOR UPDATE`,
        [id, companyId]
      );

      if (rows.length === 0) {
        throw { statusCode: 404, message: 'Carta no encontrada.' };
      }

      const card = rows[0];

      if (card.status !== 'available') {
        throw {
          statusCode: 409,
          message: `La carta N.º ${card.number} no está disponible. Estado actual: ${card.status}.`,
        };
      }

      // UPDATE — marcar como utilizada
      const { rows: updated } = await client.query<Card>(
        `UPDATE cards
         SET status = 'used', used_by = $1, used_at = NOW(), observations = $2, updated_at = NOW()
         WHERE id = $3 AND company_id = $4
         RETURNING *`,
        [userId, observations || null, id, companyId]
      );

      // INSERT historial
      await client.query(
        `INSERT INTO card_history (card_id, company_id, user_id, action, old_status, new_status, observations)
         VALUES ($1, $2, $3, 'card_used', 'available', 'used', $4)`,
        [id, companyId, userId, observations || null]
      );

      // INSERT auditoría
      await client.query(
        `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details, ip_address, user_agent, success)
         VALUES ($1, $2, 'card_used', 'cards', $3, $4, $5::inet, $6, TRUE)`,
        [
          companyId, userId, id,
          JSON.stringify({ card_number: card.number, observations }),
          req.ip, req.get('User-Agent')
        ]
      );

      return updated[0];
    });

    res.json({ message: 'Carta utilizada exitosamente.', card: result });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    if (e.statusCode) {
      res.status(e.statusCode).json({ error: e.message });
      return;
    }
    console.error('Error en useCard:', err);
    res.status(500).json({ error: 'Error al utilizar la carta.' });
  }
}

/**
 * POST /api/cards/:id/reserve
 * Reserva una carta con tiempo de expiración.
 */
export async function reserveCard(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { id } = req.params;
    const timeoutMinutes = parseInt(process.env.RESERVATION_TIMEOUT_MINUTES || '30');

    const result = await db.transaction(async (client: PoolClient) => {
      const { rows } = await client.query<{
        id: string; number: number; status: string;
      }>(
        'SELECT id, number, status FROM cards WHERE id = $1 AND company_id = $2 FOR UPDATE',
        [id, companyId]
      );

      if (rows.length === 0) throw { statusCode: 404, message: 'Carta no encontrada.' };
      const card = rows[0];
      if (card.status !== 'available') {
        throw {
          statusCode: 409,
          message: `La carta N.º ${card.number} no está disponible.`,
        };
      }

      const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

      const { rows: updated } = await client.query<Card>(
        `UPDATE cards
         SET status = 'reserved', reserved_by = $1, reserved_at = NOW(),
             reservation_expires_at = $2, updated_at = NOW()
         WHERE id = $3 AND company_id = $4 RETURNING *`,
        [userId, expiresAt, id, companyId]
      );

      await client.query(
        `INSERT INTO card_history (card_id, company_id, user_id, action, old_status, new_status, metadata)
         VALUES ($1, $2, $3, 'card_reserved', 'available', 'reserved', $4)`,
        [id, companyId, userId, JSON.stringify({ expires_at: expiresAt })]
      );

      await client.query(
        `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details, ip_address, success)
         VALUES ($1, $2, 'card_reserved', 'cards', $3, $4, $5::inet, TRUE)`,
        [companyId, userId, id, JSON.stringify({ card_number: card.number }), req.ip]
      );

      return updated[0];
    });

    res.json({ message: 'Carta reservada.', card: result });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    if (e.statusCode) {
      res.status(e.statusCode).json({ error: e.message });
      return;
    }
    console.error('Error en reserveCard:', err);
    res.status(500).json({ error: 'Error al reservar la carta.' });
  }
}

/**
 * POST /api/cards/:id/correct  (solo admin)
 * Corrección administrativa de una carta.
 */
export async function correctCard(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { id } = req.params;

    const parsed = correctCardSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos.', details: parsed.error.issues });
      return;
    }

    const { correctionReason, newStatus, observations } = parsed.data;

    const result = await db.transaction(async (client: PoolClient) => {
      const { rows } = await client.query<{
        id: string; number: number; status: string;
      }>(
        'SELECT id, number, status FROM cards WHERE id = $1 AND company_id = $2 FOR UPDATE',
        [id, companyId]
      );

      if (rows.length === 0) throw { statusCode: 404, message: 'Carta no encontrada.' };
      const card = rows[0];
      const oldStatus = card.status;

      const { rows: updated } = await client.query<Card>(
        `UPDATE cards
         SET status = $1,
             corrected_by = $2, corrected_at = NOW(),
             correction_reason = $3, observations = $4,
             used_by = CASE WHEN $1 = 'available' THEN NULL ELSE used_by END,
             used_at = CASE WHEN $1 = 'available' THEN NULL ELSE used_at END,
             reserved_by = CASE WHEN $1 = 'available' THEN NULL ELSE reserved_by END,
             reserved_at = CASE WHEN $1 = 'available' THEN NULL ELSE reserved_at END,
             updated_at = NOW()
         WHERE id = $5 AND company_id = $6 RETURNING *`,
        [newStatus, userId, correctionReason, observations || null, id, companyId]
      );

      await client.query(
        `INSERT INTO card_history (card_id, company_id, user_id, action, old_status, new_status, observations, metadata)
         VALUES ($1, $2, $3, 'card_corrected', $4, $5, $6, $7)`,
        [id, companyId, userId, oldStatus, newStatus, observations || null,
          JSON.stringify({ correction_reason: correctionReason })]
      );

      await client.query(
        `INSERT INTO audit_logs (company_id, user_id, action, resource, resource_id, details, ip_address, success)
         VALUES ($1, $2, 'card_corrected', 'cards', $3, $4, $5::inet, TRUE)`,
        [companyId, userId, id,
          JSON.stringify({ card_number: card.number, old_status: oldStatus, new_status: newStatus, correctionReason }),
          req.ip]
      );

      return updated[0];
    });

    res.json({ message: 'Carta corregida exitosamente.', card: result });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    if (e.statusCode) {
      res.status(e.statusCode).json({ error: e.message });
      return;
    }
    console.error('Error en correctCard:', err);
    res.status(500).json({ error: 'Error al corregir la carta.' });
  }
}

/**
 * GET /api/cards/my
 * Cartas del usuario autenticado (para Dashboard de usuario).
 */
export async function getMyCards(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

    const summaryResult = await db.query<{
      available: string; used_by_me: string; last_used_number: string; last_used_at: string;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'available') AS available,
         COUNT(*) FILTER (WHERE used_by = $1)         AS used_by_me,
         (SELECT number FROM cards WHERE used_by = $1 AND company_id = $2 ORDER BY used_at DESC LIMIT 1) AS last_used_number,
         (SELECT used_at FROM cards WHERE used_by = $1 AND company_id = $2 ORDER BY used_at DESC LIMIT 1) AS last_used_at
       FROM cards WHERE company_id = $2`,
      [userId, companyId]
    );

    const recentResult = await db.query(
      `SELECT number, status, used_at, observations
       FROM cards
       WHERE used_by = $1 AND company_id = $2
       ORDER BY used_at DESC
       LIMIT $3`,
      [userId, companyId, limit]
    );

    const rangeResult = await db.query(
      `SELECT name, range_start, range_end FROM numbering_ranges
       WHERE company_id = $1 AND is_active = TRUE LIMIT 1`,
      [companyId]
    );

    res.json({
      summary: summaryResult.rows[0] || {},
      recentCards: recentResult.rows,
      currentRange: rangeResult.rows[0] || null,
    });
  } catch (err) {
    console.error('Error en getMyCards:', err);
    res.status(500).json({ error: 'Error al obtener mis cartas.' });
  }
}

/**
 * GET /api/cards/recent-activity
 * Actividad reciente para el Dashboard administrativo.
 */
export async function getRecentActivity(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const limit = Math.min(20, parseInt(req.query.limit as string) || 10);

    const { rows } = await db.query(
      `SELECT
         ch.action, ch.old_status, ch.new_status, ch.created_at,
         c.number AS card_number,
         u.full_name AS user_full_name, u.username
       FROM card_history ch
       JOIN cards c ON ch.card_id = c.id
       LEFT JOIN users u ON ch.user_id = u.id
       WHERE ch.company_id = $1
       ORDER BY ch.created_at DESC
       LIMIT $2`,
      [companyId, limit]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error en getRecentActivity:', err);
    res.status(500).json({ error: 'Error al obtener actividad reciente.' });
  }
}

/**
 * POST /api/admin/cards/generate  (solo admin)
 * Genera cartas en un rango numérico.
 */
export async function generateCards(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;

    const schema = z.object({
      rangeId: z.string().uuid(),
      rangeStart: z.number().int().positive(),
      rangeEnd: z.number().int().positive(),
    }).refine(d => d.rangeEnd >= d.rangeStart, { message: 'rangeEnd debe ser >= rangeStart' });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos.', details: parsed.error.issues });
      return;
    }

    const { rangeId, rangeStart, rangeEnd } = parsed.data;
    const count = rangeEnd - rangeStart + 1;

    if (count > 10000) {
      res.status(400).json({ error: 'No se pueden generar más de 10,000 cartas a la vez.' });
      return;
    }

    // Verificar que el rango pertenece a la empresa
    const rangeCheck = await db.query(
      'SELECT id FROM numbering_ranges WHERE id = $1 AND company_id = $2',
      [rangeId, companyId]
    );
    if (rangeCheck.rows.length === 0) {
      res.status(404).json({ error: 'Rango no encontrado.' });
      return;
    }

    const { rowCount } = await db.query(
      `INSERT INTO cards (company_id, range_id, number, status)
       SELECT $1, $2, n, 'available'
       FROM generate_series($3, $4) AS n
       ON CONFLICT (company_id, number) DO NOTHING`,
      [companyId, rangeId, rangeStart, rangeEnd]
    );

    await db.query(
      `INSERT INTO audit_logs (company_id, user_id, action, resource, details, ip_address, success)
       VALUES ($1, $2, 'cards_generated', 'cards', $3, $4::inet, TRUE)`,
      [companyId, userId,
        JSON.stringify({ range_start: rangeStart, range_end: rangeEnd, inserted: rowCount }),
        req.ip]
    );

    res.json({
      message: `${rowCount} cartas generadas (${rangeStart} - ${rangeEnd}).`,
      inserted: rowCount,
    });
  } catch (err) {
    console.error('Error en generateCards:', err);
    res.status(500).json({ error: 'Error al generar cartas.' });
  }
}
