import { Router } from 'express';
import { authenticate, requireAdmin } from '../../../../middleware/auth';

// Controladores
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
} from '../controllers/categories.controller';

import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
  getCampaignFunnel,
} from '../controllers/campaigns.controller';

import {
  getChannels,
  createChannel,
  updateChannel,
  getChannelsQualityMetrics,
} from '../controllers/channels.controller';

import {
  getPublications,
  getPublicationById,
  createPublication,
  updatePublication,
  changePublicationStatus,
  duplicatePublication,
  deletePublication,
  getPublicationMetrics,
} from '../controllers/publications.controller';

import {
  getCaptacionSummary,
  getCaptacionFunnel,
  getCategoryStats,
  getTopOpeningsCaptacion,
} from '../controllers/captacion.dashboard.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ─── RESUMEN Y EMBEDIDOS DEL CENTRO DE CAPTACIÓN ──────────────────────────────
router.get('/summary', getCaptacionSummary);
router.get('/funnel', getCaptacionFunnel);
router.get('/category-stats', getCategoryStats);
router.get('/top-openings', getTopOpeningsCaptacion);

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────
router.get('/categories', getCategories);
router.get('/categories/:id', getCategoryById);
router.post('/categories', requireAdmin, createCategory);
router.put('/categories/:id', requireAdmin, updateCategory);
router.patch('/categories/:id/toggle', requireAdmin, toggleCategoryStatus);

// ─── CAMPAÑAS ─────────────────────────────────────────────────────────────────
router.get('/campaigns', getCampaigns);
router.get('/campaigns/:id', getCampaignById);
router.post('/campaigns', requireAdmin, createCampaign);
router.put('/campaigns/:id', requireAdmin, updateCampaign);
router.patch('/campaigns/:id/status', requireAdmin, updateCampaignStatus);
router.get('/campaigns/:id/funnel', getCampaignFunnel);

// ─── CANALES ──────────────────────────────────────────────────────────────────
router.get('/channels', getChannels);
router.post('/channels', requireAdmin, createChannel);
router.put('/channels/:id', requireAdmin, updateChannel);
router.get('/channels/quality-metrics', getChannelsQualityMetrics);

// ─── PUBLICACIONES ────────────────────────────────────────────────────────────
router.get('/publications', getPublications);
router.get('/publications/:id', getPublicationById);
router.post('/publications', requireAdmin, createPublication);
router.put('/publications/:id', requireAdmin, updatePublication);
router.post('/publications/:id/status', requireAdmin, changePublicationStatus);
router.post('/publications/:id/duplicate', requireAdmin, duplicatePublication);
router.delete('/publications/:id', requireAdmin, deletePublication);
router.get('/publications/:id/metrics', getPublicationMetrics);

export default router;
