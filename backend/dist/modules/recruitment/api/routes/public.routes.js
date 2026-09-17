"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const public_controller_1 = require("../controllers/public.controller");
const expediente_controller_1 = require("../controllers/public/expediente.controller");
const cms_controller_1 = require("../controllers/cms.controller");
const router = (0, express_1.Router)();
// ─── RATE LIMITER PÚBLICO ────────────────────────────────────────────────────
const publicApplyLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100, // 100 requests per IP
    message: { error: 'Demasiadas solicitudes desde esta dirección. Por favor espere unos minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const publicViewsLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Demasiadas solicitudes de vista.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// ─── CONFIGURACIÓN DE MULTER PARA ALMACENAMIENTO SEGURO ───────────────────────
const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'candidates');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
// Filtro de archivos permitidos
const fileFilter = (_req, file, cb) => {
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
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (allowedExts.includes(ext) || allowedMimes.includes(mime)) {
        cb(null, true);
    }
    else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan PDF, DOC, DOCX e imágenes (JPG, PNG, WEBP, GIF).'));
    }
};
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
    },
    fileFilter,
});
// Configuración de multer para procesamiento en memoria (para clasificación)
const memoryStorage = multer_1.default.memoryStorage();
const uploadMemory = (0, multer_1.default)({
    storage: memoryStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
    },
    fileFilter,
});
// ─── RUTAS PÚBLICAS ──────────────────────────────────────────────────────────
// Publicaciones del Centro de Captación (/postular/p/:slug)
router.get('/p/:slug', public_controller_1.getPublicPublicationBySlug);
router.post('/p/:slug/view', publicViewsLimiter, public_controller_1.registerPublicationView);
router.post('/p/:slug/apply/init', publicApplyLimiter, public_controller_1.initApplication);
// Convocatorias
router.get('/openings', public_controller_1.getPublicOpenings);
router.get('/openings/:id', public_controller_1.getPublicOpeningById);
router.get('/openings/:id/document-requirements', public_controller_1.getDocumentRequirements);
router.get('/openings/:id/expediente-requirements', expediente_controller_1.getPublicOpeningDocumentRequirements);
// CMS Institucional del Portal Público (Fase 2.8)
router.get('/content/:sectionKey', cms_controller_1.getPublicSectionContent);
// Postulación (Asistente y Borrador)
router.post('/apply/init', publicApplyLimiter, public_controller_1.initApplication);
router.get('/apply/:draftToken', public_controller_1.getDraftApplication);
router.put('/apply/:draftToken/profile', public_controller_1.saveDraftProfile);
router.put('/apply/:draftToken/autosave', public_controller_1.autosaveDraft);
router.post('/apply/:draftToken/consent', public_controller_1.registerConsent);
router.get('/apply/:draftToken/fit-score', public_controller_1.getApplicationFitScore);
router.get('/apply/:draftToken/expediente-status', public_controller_1.getExpedienteStatus);
router.get('/apply/:draftToken/expediente-status-new', expediente_controller_1.getPublicExpedienteStatus);
router.get('/apply/:draftToken/documents', expediente_controller_1.getApplicationDocuments);
router.post('/apply/:draftToken/upload-document', uploadMemory.single('document'), expediente_controller_1.uploadDocumentWithClassification);
router.put('/apply/:draftToken/documents/:documentId/confirm-classification', expediente_controller_1.confirmDocumentClassification);
router.delete('/apply/:draftToken/documents/:documentId', expediente_controller_1.deleteApplicationDocument);
router.get('/contact-info', public_controller_1.getPublicContactInfo);
// Carga de Archivos
router.post('/apply/:draftToken/upload-cv', upload.single('cvFile'), public_controller_1.uploadCVFile);
router.post('/apply/:draftToken/upload-photos', upload.array('photos', 10), public_controller_1.uploadDocumentPhotos);
router.delete('/apply/:draftToken/documents/:docId', public_controller_1.deleteDraftDocument);
// Envío Final y PDF
router.post('/apply/:draftToken/submit', public_controller_1.submitApplication);
router.get('/apply/:draftToken/generate-cv-pdf', public_controller_1.generateCVPdf);
// Consulta de Estado de Postulación
router.post('/track', public_controller_1.trackApplication);
router.post('/tracking', publicApplyLimiter, public_controller_1.trackApplication);
exports.default = router;
//# sourceMappingURL=public.routes.js.map