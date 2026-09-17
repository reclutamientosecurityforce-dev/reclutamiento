"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../../middleware/auth");
// Controladores
const categories_controller_1 = require("../controllers/categories.controller");
const campaigns_controller_1 = require("../controllers/campaigns.controller");
const channels_controller_1 = require("../controllers/channels.controller");
const publications_controller_1 = require("../controllers/publications.controller");
const captacion_dashboard_controller_1 = require("../controllers/captacion.dashboard.controller");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// ─── RESUMEN Y EMBEDIDOS DEL CENTRO DE CAPTACIÓN ──────────────────────────────
router.get('/summary', captacion_dashboard_controller_1.getCaptacionSummary);
router.get('/funnel', captacion_dashboard_controller_1.getCaptacionFunnel);
router.get('/category-stats', captacion_dashboard_controller_1.getCategoryStats);
router.get('/top-openings', captacion_dashboard_controller_1.getTopOpeningsCaptacion);
// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────
router.get('/categories', categories_controller_1.getCategories);
router.get('/categories/:id', categories_controller_1.getCategoryById);
router.post('/categories', auth_1.requireAdmin, categories_controller_1.createCategory);
router.put('/categories/:id', auth_1.requireAdmin, categories_controller_1.updateCategory);
router.patch('/categories/:id/toggle', auth_1.requireAdmin, categories_controller_1.toggleCategoryStatus);
// ─── CAMPAÑAS ─────────────────────────────────────────────────────────────────
router.get('/campaigns', campaigns_controller_1.getCampaigns);
router.get('/campaigns/:id', campaigns_controller_1.getCampaignById);
router.post('/campaigns', auth_1.requireAdmin, campaigns_controller_1.createCampaign);
router.put('/campaigns/:id', auth_1.requireAdmin, campaigns_controller_1.updateCampaign);
router.patch('/campaigns/:id/status', auth_1.requireAdmin, campaigns_controller_1.updateCampaignStatus);
router.get('/campaigns/:id/funnel', campaigns_controller_1.getCampaignFunnel);
// ─── CANALES ──────────────────────────────────────────────────────────────────
router.get('/channels', channels_controller_1.getChannels);
router.post('/channels', auth_1.requireAdmin, channels_controller_1.createChannel);
router.put('/channels/:id', auth_1.requireAdmin, channels_controller_1.updateChannel);
router.get('/channels/quality-metrics', channels_controller_1.getChannelsQualityMetrics);
// ─── PUBLICACIONES ────────────────────────────────────────────────────────────
router.get('/publications', publications_controller_1.getPublications);
router.get('/publications/:id', publications_controller_1.getPublicationById);
router.post('/publications', auth_1.requireAdmin, publications_controller_1.createPublication);
router.put('/publications/:id', auth_1.requireAdmin, publications_controller_1.updatePublication);
router.post('/publications/:id/status', auth_1.requireAdmin, publications_controller_1.changePublicationStatus);
router.post('/publications/:id/duplicate', auth_1.requireAdmin, publications_controller_1.duplicatePublication);
router.delete('/publications/:id', auth_1.requireAdmin, publications_controller_1.deletePublication);
router.get('/publications/:id/metrics', publications_controller_1.getPublicationMetrics);
exports.default = router;
//# sourceMappingURL=captacion.routes.js.map