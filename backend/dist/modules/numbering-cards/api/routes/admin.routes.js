"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../../middleware/auth");
const users_controller_1 = require("../controllers/users.controller");
const sessions_controller_1 = require("../controllers/sessions.controller");
const audit_controller_1 = require("../controllers/audit.controller");
const reports_controller_1 = require("../controllers/reports.controller");
const ranges_controller_1 = require("../controllers/ranges.controller");
const cards_controller_1 = require("../controllers/cards.controller");
const cms_controller_1 = require("../../../recruitment/api/controllers/cms.controller");
const multer_1 = __importDefault(require("multer"));
const uploadMemory = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
const router = (0, express_1.Router)();
// Todas las rutas admin requieren autenticación + rol admin
router.use(auth_1.authenticate, auth_1.requireAdmin);
// ─── USUARIOS ─────────────────────────────────────────────────────────────────
router.get('/users', users_controller_1.getUsers);
router.post('/users', users_controller_1.createUser);
router.put('/users/:id', users_controller_1.updateUser);
router.delete('/users/:id', users_controller_1.deleteUser);
// ─── SESIONES ─────────────────────────────────────────────────────────────────
router.get('/sessions', sessions_controller_1.getSessions);
router.delete('/sessions/:id', sessions_controller_1.terminateSession);
// ─── AUDITORÍA ────────────────────────────────────────────────────────────────
router.get('/audit', audit_controller_1.getAuditLogs);
// ─── REPORTES ─────────────────────────────────────────────────────────────────
router.get('/reports/cards', reports_controller_1.generateCardReport);
router.get('/reports/audit', reports_controller_1.generateAuditReport);
// ─── RANGOS ───────────────────────────────────────────────────────────────────
router.get('/ranges', ranges_controller_1.getRanges);
router.post('/ranges', ranges_controller_1.createRange);
// ─── CARTAS (ADMIN) ───────────────────────────────────────────────────────────
router.get('/cards/summary', cards_controller_1.getCardsSummary);
router.get('/cards/recent-activity', cards_controller_1.getRecentActivity);
router.post('/cards/generate', cards_controller_1.generateCards);
// ─── CMS DEL PORTAL PÚBLICO (Fase 2.8) ──────────────────────────────────────────
router.get('/portal/sections', cms_controller_1.getAdminSections);
router.get('/portal/sections/:sectionKey', cms_controller_1.getAdminSectionByKey);
router.put('/portal/sections/:sectionKey', cms_controller_1.saveAdminDraft);
router.post('/portal/sections/:sectionKey/publish', cms_controller_1.publishAdminSection);
router.get('/portal/sections/:sectionKey/history', cms_controller_1.getAdminSectionHistory);
router.post('/portal/sections/:sectionKey/restore/:version', cms_controller_1.restoreAdminSectionVersion);
router.post('/portal/media', uploadMemory.single('media'), cms_controller_1.uploadPublicMedia);
router.get('/portal/media', cms_controller_1.getPublicMediaList);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map