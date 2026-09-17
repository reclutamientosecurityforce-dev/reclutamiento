import { Request, Response } from 'express';
/**
 * GET /api/cards/summary
 * Resumen ejecutivo mediante consultas agregadas (NO SELECT * FROM cards).
 * Usado por el Dashboard administrativo y de usuario.
 */
export declare function getCardsSummary(req: Request, res: Response): Promise<void>;
/**
 * GET /api/cards
 * Lista paginada de cartas (NO envía todas al frontend).
 * Parámetros: page, limit, status, number (búsqueda exacta), search
 */
export declare function getCards(req: Request, res: Response): Promise<void>;
/**
 * GET /api/cards/:id
 * Detalle de una carta específica.
 */
export declare function getCard(req: Request, res: Response): Promise<void>;
/**
 * GET /api/cards/:id/history
 * Historial completo de una carta (trazabilidad).
 */
export declare function getCardHistory(req: Request, res: Response): Promise<void>;
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
export declare function useCard(req: Request, res: Response): Promise<void>;
/**
 * POST /api/cards/:id/reserve
 * Reserva una carta con tiempo de expiración.
 */
export declare function reserveCard(req: Request, res: Response): Promise<void>;
/**
 * POST /api/cards/:id/correct  (solo admin)
 * Corrección administrativa de una carta.
 */
export declare function correctCard(req: Request, res: Response): Promise<void>;
/**
 * GET /api/cards/my
 * Cartas del usuario autenticado (para Dashboard de usuario).
 */
export declare function getMyCards(req: Request, res: Response): Promise<void>;
/**
 * GET /api/cards/recent-activity
 * Actividad reciente para el Dashboard administrativo.
 */
export declare function getRecentActivity(req: Request, res: Response): Promise<void>;
/**
 * POST /api/admin/cards/generate  (solo admin)
 * Genera cartas en un rango numérico.
 */
export declare function generateCards(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=cards.controller.d.ts.map