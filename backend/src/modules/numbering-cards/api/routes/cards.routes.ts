import { Router } from 'express';
import { authenticate, requireAdmin } from '../../../../middleware/auth';
import {
  getCards,
  getCard,
  getCardHistory,
  getCardsSummary,
  useCard,
  reserveCard,
  correctCard,
  getMyCards,
  getRecentActivity,
  generateCards,
} from '../controllers/cards.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/cards/summary — Resumen ejecutivo (Dashboard)
// NOTA: Se registra ANTES de /:id para evitar conflicto de rutas
router.get('/summary', getCardsSummary);

// GET /api/cards/my — Mis cartas (Dashboard de usuario)
router.get('/my', getMyCards);

// GET /api/cards/recent-activity — Para Dashboard admin
router.get('/recent-activity', requireAdmin, getRecentActivity);

// GET /api/cards — Lista paginada
router.get('/', getCards);

// GET /api/cards/:id — Detalle
router.get('/:id', getCard);

// GET /api/cards/:id/history — Historial (trazabilidad)
router.get('/:id/history', getCardHistory);

// POST /api/cards/:id/use — Utilizar carta (concurrencia crítica)
router.post('/:id/use', useCard);

// POST /api/cards/:id/reserve — Reservar carta
router.post('/:id/reserve', reserveCard);

// POST /api/cards/:id/correct — Corrección administrativa (solo admin)
router.post('/:id/correct', requireAdmin, correctCard);

// POST /api/admin/cards/generate — Generar cartas (solo admin)
router.post('/generate', requireAdmin, generateCards);

export default router;
