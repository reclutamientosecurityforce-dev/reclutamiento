import { Router } from 'express';
import { authenticate, requireAdmin } from '../../../../middleware/auth';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/users.controller';
import { getSessions, terminateSession } from '../controllers/sessions.controller';
import { getAuditLogs } from '../controllers/audit.controller';
import { generateCardReport, generateAuditReport } from '../controllers/reports.controller';
import { getRanges, createRange } from '../controllers/ranges.controller';
import {
  getCardsSummary,
  getRecentActivity,
  generateCards,
} from '../controllers/cards.controller';
import {
  getAdminSections,
  getAdminSectionByKey,
  saveAdminDraft,
  publishAdminSection,
  getAdminSectionHistory,
  restoreAdminSectionVersion,
  uploadPublicMedia,
  getPublicMediaList,
} from '../../../recruitment/api/controllers/cms.controller';
import multer from 'multer';

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();

// Todas las rutas admin requieren autenticación + rol admin
router.use(authenticate, requireAdmin);

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// ─── SESIONES ─────────────────────────────────────────────────────────────────
router.get('/sessions', getSessions);
router.delete('/sessions/:id', terminateSession);

// ─── AUDITORÍA ────────────────────────────────────────────────────────────────
router.get('/audit', getAuditLogs);

// ─── REPORTES ─────────────────────────────────────────────────────────────────
router.get('/reports/cards', generateCardReport);
router.get('/reports/audit', generateAuditReport);

// ─── RANGOS ───────────────────────────────────────────────────────────────────
router.get('/ranges', getRanges);
router.post('/ranges', createRange);

// ─── CARTAS (ADMIN) ───────────────────────────────────────────────────────────
router.get('/cards/summary', getCardsSummary);
router.get('/cards/recent-activity', getRecentActivity);
router.post('/cards/generate', generateCards);

// ─── CMS DEL PORTAL PÚBLICO (Fase 2.8) ──────────────────────────────────────────
router.get('/portal/sections', getAdminSections);
router.get('/portal/sections/:sectionKey', getAdminSectionByKey);
router.put('/portal/sections/:sectionKey', saveAdminDraft);
router.post('/portal/sections/:sectionKey/publish', publishAdminSection);
router.get('/portal/sections/:sectionKey/history', getAdminSectionHistory);
router.post('/portal/sections/:sectionKey/restore/:version', restoreAdminSectionVersion);
router.post('/portal/media', uploadMemory.single('media'), uploadPublicMedia);
router.get('/portal/media', getPublicMediaList);

export default router;
