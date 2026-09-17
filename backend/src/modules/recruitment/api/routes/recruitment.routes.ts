import { Router } from 'express';
import { authenticate, requireAdmin } from '../../../../middleware/auth';
import { getRecruitmentSummary, getRecentRecruitmentActivity } from '../controllers/recruitment.dashboard.controller';
import { getCandidates, getCandidate, createCandidate, updateCandidate, getCandidateExpediente } from '../controllers/candidates.controller';
import { getOpenings, createOpening, updateOpening, updateCompanyContact, getCompanyContact } from '../controllers/openings.controller';
import { getPipelineApplications, advanceCandidateStage } from '../controllers/pipeline.controller';
import { getInterviews, scheduleInterview } from '../controllers/interviews.controller';
import { generateRecruitmentReport } from '../controllers/reports.controller';

import {
  getOpeningRequirements,
  saveOpeningRequirements,
  evaluateApplicationEndpoint,
  evaluateAllOpeningApplications,
  getApplicationEvaluation,
  overrideEvaluationEndpoint,
  getOpeningRanking,
  getEvaluationSummary,
} from '../controllers/prefilter.controller';
import {
  getOpeningDocumentRequirements,
  createOpeningDocumentRequirement,
  updateOpeningDocumentRequirement,
  deleteOpeningDocumentRequirement,
  getExpedienteStatus,
  getExpedienteProgress,
  setupDefaultDocumentRequirements,
} from '../controllers/document-requirements.controller';

import captacionRoutes from './captacion.routes';
import { downloadDocument, getSignedDocumentUrl, resolveSignedUrl } from '../controllers/documents.controller';

const router = Router();

// Ruta pública efímera para resolver tokens firmados de descarga
router.get('/documents/resolve-signed-url', resolveSignedUrl);

// Todas las demás rutas de reclutamiento requieren autenticación estricta
router.use(authenticate);

// ─── CENTRO DE CAPTACIÓN ──────────────────────────────────────────────────────
router.use('/captacion', captacionRoutes);

// ─── DOCUMENTOS Y SEGURIDAD ACL (Fase 2.7.1) ──────────────────────────────────
router.get('/documents/:id/download', downloadDocument);
router.get('/documents/:id/signed-url', getSignedDocumentUrl);

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
router.get('/summary', getRecruitmentSummary);
router.get('/recent-activity', getRecentRecruitmentActivity);

// ─── POSTULANTES / CANDIDATOS ────────────────────────────────────────────────
router.get('/candidates', getCandidates);
router.get('/candidates/:id', getCandidate);
router.get('/candidates/:id/expediente', getCandidateExpediente);
router.post('/candidates', createCandidate);
router.put('/candidates/:id', updateCandidate);

// ─── CONVOCATORIAS / VACANTES ────────────────────────────────────────────────
router.get('/openings', getOpenings);
router.post('/openings', createOpening);
router.put('/openings/:id', updateOpening);

// ─── CONFIGURACIÓN DE EMPRESA ────────────────────────────────────────────────
router.get('/companies/contact', getCompanyContact);
router.put('/companies/contact', updateCompanyContact);

// ─── MOTOR DE PREFILTRO, REQUISITOS Y RANKING ────────────────────────────────
router.get('/openings/:id/requirements', getOpeningRequirements);
router.post('/openings/:id/requirements', saveOpeningRequirements);
router.get('/openings/:id/ranking', getOpeningRanking);
router.get('/openings/:id/evaluation-summary', getEvaluationSummary);
router.post('/openings/:id/evaluate-all', evaluateAllOpeningApplications);

// ─── REQUISITOS DOCUMENTALES (Fase 2.9.3) ─────────────────────────────────────
router.get('/openings/:id/document-requirements', getOpeningDocumentRequirements);
router.post('/openings/:id/document-requirements', createOpeningDocumentRequirement);
router.put('/document-requirements/:id', updateOpeningDocumentRequirement);
router.delete('/document-requirements/:id', deleteOpeningDocumentRequirement);
router.post('/openings/:id/setup-default-requirements', setupDefaultDocumentRequirements);

// ─── ESTADO DEL EXPEDIENTE DIGITAL ─────────────────────────────────────────────
router.get('/applications/:id/expediente-status', getExpedienteStatus);
router.get('/applications/:id/expediente-progress', getExpedienteProgress);

router.post('/applications/:id/evaluate', evaluateApplicationEndpoint);
router.get('/applications/:id/evaluation', getApplicationEvaluation);
router.post('/applications/:id/override', overrideEvaluationEndpoint);

// ─── PIPELINE / SELECCIÓN ────────────────────────────────────────────────────
router.get('/pipeline', getPipelineApplications);
router.post('/pipeline/:id/advance', advanceCandidateStage);

// ─── ENTREVISTAS ─────────────────────────────────────────────────────────────
router.get('/interviews', getInterviews);
router.post('/interviews', scheduleInterview);

// ─── REPORTES ────────────────────────────────────────────────────────────────
router.get('/reports/candidates', generateRecruitmentReport);

export default router;
