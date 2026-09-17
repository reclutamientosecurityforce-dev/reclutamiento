"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../../middleware/auth");
const recruitment_dashboard_controller_1 = require("../controllers/recruitment.dashboard.controller");
const candidates_controller_1 = require("../controllers/candidates.controller");
const openings_controller_1 = require("../controllers/openings.controller");
const pipeline_controller_1 = require("../controllers/pipeline.controller");
const interviews_controller_1 = require("../controllers/interviews.controller");
const reports_controller_1 = require("../controllers/reports.controller");
const prefilter_controller_1 = require("../controllers/prefilter.controller");
const document_requirements_controller_1 = require("../controllers/document-requirements.controller");
const captacion_routes_1 = __importDefault(require("./captacion.routes"));
const documents_controller_1 = require("../controllers/documents.controller");
const router = (0, express_1.Router)();
// Ruta pública efímera para resolver tokens firmados de descarga
router.get('/documents/resolve-signed-url', documents_controller_1.resolveSignedUrl);
// Todas las demás rutas de reclutamiento requieren autenticación estricta
router.use(auth_1.authenticate);
// ─── CENTRO DE CAPTACIÓN ──────────────────────────────────────────────────────
router.use('/captacion', captacion_routes_1.default);
// ─── DOCUMENTOS Y SEGURIDAD ACL (Fase 2.7.1) ──────────────────────────────────
router.get('/documents/:id/download', documents_controller_1.downloadDocument);
router.get('/documents/:id/signed-url', documents_controller_1.getSignedDocumentUrl);
// ─── DASHBOARD ────────────────────────────────────────────────────────────────
router.get('/summary', recruitment_dashboard_controller_1.getRecruitmentSummary);
router.get('/recent-activity', recruitment_dashboard_controller_1.getRecentRecruitmentActivity);
// ─── POSTULANTES / CANDIDATOS ────────────────────────────────────────────────
router.get('/candidates', candidates_controller_1.getCandidates);
router.get('/candidates/:id', candidates_controller_1.getCandidate);
router.get('/candidates/:id/expediente', candidates_controller_1.getCandidateExpediente);
router.post('/candidates', candidates_controller_1.createCandidate);
router.put('/candidates/:id', candidates_controller_1.updateCandidate);
// ─── CONVOCATORIAS / VACANTES ────────────────────────────────────────────────
router.get('/openings', openings_controller_1.getOpenings);
router.post('/openings', openings_controller_1.createOpening);
router.put('/openings/:id', openings_controller_1.updateOpening);
// ─── CONFIGURACIÓN DE EMPRESA ────────────────────────────────────────────────
router.put('/companies/contact', openings_controller_1.updateCompanyContact);
// ─── MOTOR DE PREFILTRO, REQUISITOS Y RANKING ────────────────────────────────
router.get('/openings/:id/requirements', prefilter_controller_1.getOpeningRequirements);
router.post('/openings/:id/requirements', prefilter_controller_1.saveOpeningRequirements);
router.get('/openings/:id/ranking', prefilter_controller_1.getOpeningRanking);
router.get('/openings/:id/evaluation-summary', prefilter_controller_1.getEvaluationSummary);
router.post('/openings/:id/evaluate-all', prefilter_controller_1.evaluateAllOpeningApplications);
// ─── REQUISITOS DOCUMENTALES (Fase 2.9.3) ─────────────────────────────────────
router.get('/openings/:id/document-requirements', document_requirements_controller_1.getOpeningDocumentRequirements);
router.post('/openings/:id/document-requirements', document_requirements_controller_1.createOpeningDocumentRequirement);
router.put('/document-requirements/:id', document_requirements_controller_1.updateOpeningDocumentRequirement);
router.delete('/document-requirements/:id', document_requirements_controller_1.deleteOpeningDocumentRequirement);
router.post('/openings/:id/setup-default-requirements', document_requirements_controller_1.setupDefaultDocumentRequirements);
// ─── ESTADO DEL EXPEDIENTE DIGITAL ─────────────────────────────────────────────
router.get('/applications/:id/expediente-status', document_requirements_controller_1.getExpedienteStatus);
router.get('/applications/:id/expediente-progress', document_requirements_controller_1.getExpedienteProgress);
router.post('/applications/:id/evaluate', prefilter_controller_1.evaluateApplicationEndpoint);
router.get('/applications/:id/evaluation', prefilter_controller_1.getApplicationEvaluation);
router.post('/applications/:id/override', prefilter_controller_1.overrideEvaluationEndpoint);
// ─── PIPELINE / SELECCIÓN ────────────────────────────────────────────────────
router.get('/pipeline', pipeline_controller_1.getPipelineApplications);
router.post('/pipeline/:id/advance', pipeline_controller_1.advanceCandidateStage);
// ─── ENTREVISTAS ─────────────────────────────────────────────────────────────
router.get('/interviews', interviews_controller_1.getInterviews);
router.post('/interviews', interviews_controller_1.scheduleInterview);
// ─── REPORTES ────────────────────────────────────────────────────────────────
router.get('/reports/candidates', reports_controller_1.generateRecruitmentReport);
exports.default = router;
//# sourceMappingURL=recruitment.routes.js.map