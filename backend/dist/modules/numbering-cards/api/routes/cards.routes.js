"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../../middleware/auth");
const cards_controller_1 = require("../controllers/cards.controller");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// GET /api/cards/summary — Resumen ejecutivo (Dashboard)
// NOTA: Se registra ANTES de /:id para evitar conflicto de rutas
router.get('/summary', cards_controller_1.getCardsSummary);
// GET /api/cards/my — Mis cartas (Dashboard de usuario)
router.get('/my', cards_controller_1.getMyCards);
// GET /api/cards/recent-activity — Para Dashboard admin
router.get('/recent-activity', auth_1.requireAdmin, cards_controller_1.getRecentActivity);
// GET /api/cards — Lista paginada
router.get('/', cards_controller_1.getCards);
// GET /api/cards/:id — Detalle
router.get('/:id', cards_controller_1.getCard);
// GET /api/cards/:id/history — Historial (trazabilidad)
router.get('/:id/history', cards_controller_1.getCardHistory);
// POST /api/cards/:id/use — Utilizar carta (concurrencia crítica)
router.post('/:id/use', cards_controller_1.useCard);
// POST /api/cards/:id/reserve — Reservar carta
router.post('/:id/reserve', cards_controller_1.reserveCard);
// POST /api/cards/:id/correct — Corrección administrativa (solo admin)
router.post('/:id/correct', auth_1.requireAdmin, cards_controller_1.correctCard);
// POST /api/admin/cards/generate — Generar cartas (solo admin)
router.post('/generate', auth_1.requireAdmin, cards_controller_1.generateCards);
exports.default = router;
//# sourceMappingURL=cards.routes.js.map