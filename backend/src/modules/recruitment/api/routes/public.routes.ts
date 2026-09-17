import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getPublicOpenings,
  getPublicOpeningById,
  initApplication,
  getDraftApplication,
  saveDraftProfile,
  uploadCVFile,
  uploadDocumentPhotos,
  deleteDraftDocument,
  submitApplication,
  trackApplication,
  generateCVPdf,
  getPublicPublicationBySlug,
  registerPublicationView,
  autosaveDraft,
  registerConsent,
  getApplicationFitScore,
  getPublicContactInfo,
  getDocumentRequirements,
  getExpedienteStatus,
} from '../controllers/public.controller';
import {
  getPublicOpeningDocumentRequirements,
  getPublicExpedienteStatus,
  uploadDocumentWithClassification,
  confirmDocumentClassification,
  getApplicationDocuments,
  deleteApplicationDocument,
} from '../controllers/public/expediente.controller';
import { getPublicSectionContent } from '../controllers/cms.controller';

const router = Router();

// ─── RATE LIMITER PÚBLICO ────────────────────────────────────────────────────
const publicApplyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // 100 requests per IP
  message: { error: 'Demasiadas solicitudes desde esta dirección. Por favor espere unos minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const publicViewsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Demasiadas solicitudes de vista.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── CONFIGURACIÓN DE MULTER PARA ALMACENAMIENTO SEGURO ───────────────────────
const uploadDir = path.join(process.cwd(), 'uploads', 'candidates');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Filtro de archivos permitidos
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExts = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;
  
  if (allowedExts.includes(ext) || allowedMimes.includes(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan PDF, DOC, DOCX e imágenes (JPG, PNG, WEBP, GIF).'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter,
});

// Configuración de multer para procesamiento en memoria (para clasificación)
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter,
});

// ─── RUTAS PÚBLICAS ──────────────────────────────────────────────────────────

// Publicaciones del Centro de Captación (/postular/p/:slug)
router.get('/p/:slug', getPublicPublicationBySlug);
router.post('/p/:slug/view', publicViewsLimiter, registerPublicationView);
router.post('/p/:slug/apply/init', publicApplyLimiter, initApplication);

// Convocatorias
router.get('/openings', getPublicOpenings);
router.get('/openings/:id', getPublicOpeningById);
router.get('/openings/:id/document-requirements', getDocumentRequirements);
router.get('/openings/:id/expediente-requirements', getPublicOpeningDocumentRequirements);

// CMS Institucional del Portal Público (Fase 2.8)
router.get('/content/:sectionKey', getPublicSectionContent);

// Postulación (Asistente y Borrador)
router.post('/apply/init', publicApplyLimiter, initApplication);
router.get('/apply/:draftToken', getDraftApplication);
router.put('/apply/:draftToken/profile', saveDraftProfile);
router.put('/apply/:draftToken/autosave', autosaveDraft);
router.post('/apply/:draftToken/consent', registerConsent);
router.get('/apply/:draftToken/fit-score', getApplicationFitScore);
router.get('/apply/:draftToken/expediente-status', getExpedienteStatus);
router.get('/apply/:draftToken/expediente-status-new', getPublicExpedienteStatus);
router.get('/apply/:draftToken/documents', getApplicationDocuments);
router.post('/apply/:draftToken/upload-document', uploadMemory.single('document'), uploadDocumentWithClassification);
router.put('/apply/:draftToken/documents/:documentId/confirm-classification', confirmDocumentClassification);
router.delete('/apply/:draftToken/documents/:documentId', deleteApplicationDocument);
router.get('/contact-info', getPublicContactInfo);

// Carga de Archivos
router.post('/apply/:draftToken/upload-cv', upload.single('cvFile'), uploadCVFile);
router.post('/apply/:draftToken/upload-photos', upload.array('photos', 10), uploadDocumentPhotos);
router.delete('/apply/:draftToken/documents/:docId', deleteDraftDocument);

// Envío Final y PDF
router.post('/apply/:draftToken/submit', submitApplication);
router.get('/apply/:draftToken/generate-cv-pdf', generateCVPdf);

// Consulta de Estado de Postulación
router.post('/track', trackApplication);
router.post('/tracking', publicApplyLimiter, trackApplication);

export default router;
