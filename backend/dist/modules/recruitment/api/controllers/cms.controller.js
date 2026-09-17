"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTROLADOR CMS DEL PORTAL PÚBLICO (Fase 2.8)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminSections = getAdminSections;
exports.getAdminSectionByKey = getAdminSectionByKey;
exports.saveAdminDraft = saveAdminDraft;
exports.publishAdminSection = publishAdminSection;
exports.getAdminSectionHistory = getAdminSectionHistory;
exports.restoreAdminSectionVersion = restoreAdminSectionVersion;
exports.uploadPublicMedia = uploadPublicMedia;
exports.getPublicMediaList = getPublicMediaList;
exports.getPublicSectionContent = getPublicSectionContent;
const cms_service_1 = require("../../domain/services/cms.service");
const storage_1 = require("../../../../shared/storage");
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
/**
 * GET /api/admin/portal/sections
 * Lista todas las secciones configurables con su estado actual (draft / published)
 */
async function getAdminSections(req, res) {
    try {
        const companyId = req.user.companyId;
        const sections = await cms_service_1.CmsService.getSections(companyId);
        res.json(sections);
    }
    catch (err) {
        console.error('Error en getAdminSections:', err);
        res.status(500).json({ error: 'Error al obtener secciones del portal.' });
    }
}
/**
 * GET /api/admin/portal/sections/:sectionKey
 * Obtiene el contenido de una sección para edición (preferDraft por defecto)
 */
async function getAdminSectionByKey(req, res) {
    try {
        const companyId = req.user.companyId;
        const { sectionKey } = req.params;
        const preferDraft = req.query.preferDraft !== 'false';
        const section = await cms_service_1.CmsService.getAdminSection(companyId, sectionKey, preferDraft);
        res.json(section);
    }
    catch (err) {
        console.error('Error en getAdminSectionByKey:', err);
        res.status(500).json({ error: 'Error al obtener sección.' });
    }
}
/**
 * PUT /api/admin/portal/sections/:sectionKey
 * Guarda los cambios como borrador (draft) sin afectar la versión pública
 */
async function saveAdminDraft(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const { sectionKey } = req.params;
        const { title, subtitle, description, content_data, media_urls } = req.body;
        const draft = await cms_service_1.CmsService.saveDraft(companyId, sectionKey, {
            title,
            subtitle,
            description,
            content_data,
            media_urls,
        }, userId);
        res.json({
            message: 'Borrador guardado exitosamente.',
            draft,
        });
    }
    catch (err) {
        console.error('Error en saveAdminDraft:', err);
        res.status(500).json({ error: 'Error al guardar borrador.' });
    }
}
/**
 * POST /api/admin/portal/sections/:sectionKey/publish
 * Publica la versión del borrador en vivo y genera entrada en el historial
 */
async function publishAdminSection(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const { sectionKey } = req.params;
        const published = await cms_service_1.CmsService.publishSection(companyId, sectionKey, userId);
        res.json({
            message: 'Sección publicada exitosamente en el portal.',
            published,
        });
    }
    catch (err) {
        console.error('Error en publishAdminSection:', err);
        res.status(500).json({ error: 'Error al publicar sección.' });
    }
}
/**
 * GET /api/admin/portal/sections/:sectionKey/history
 * Obtiene el historial de versiones publicadas de la sección
 */
async function getAdminSectionHistory(req, res) {
    try {
        const companyId = req.user.companyId;
        const { sectionKey } = req.params;
        const history = await cms_service_1.CmsService.getSectionHistory(companyId, sectionKey);
        res.json(history);
    }
    catch (err) {
        console.error('Error en getAdminSectionHistory:', err);
        res.status(500).json({ error: 'Error al obtener historial.' });
    }
}
/**
 * POST /api/admin/portal/sections/:sectionKey/restore/:version
 * Restaura una versión histórica anterior como nuevo borrador activo
 */
async function restoreAdminSectionVersion(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const { sectionKey, version } = req.params;
        const restoredDraft = await cms_service_1.CmsService.restoreVersion(companyId, sectionKey, parseInt(version, 10), userId);
        res.json({
            message: `Versión ${version} restaurada como borrador para revisión.`,
            draft: restoredDraft,
        });
    }
    catch (err) {
        console.error('Error en restoreAdminSectionVersion:', err);
        res.status(400).json({ error: err.message || 'Error al restaurar versión.' });
    }
}
/**
 * POST /api/admin/portal/media
 * Sube un archivo multimedia público (imágenes de banners, héroes, logos)
 */
async function uploadPublicMedia(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const { sectionKey, altText } = req.body;
        if (!req.file) {
            res.status(400).json({ error: 'No se envió ningún archivo.' });
            return;
        }
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/svg+xml',
            'image/gif',
            'video/mp4',
            'video/webm',
        ];
        if (!allowedMimes.includes(req.file.mimetype)) {
            res.status(400).json({
                error: 'Formato no permitido. Solo se aceptan imágenes (JPEG, PNG, WEBP, SVG, GIF) o videos (MP4, WEBM).',
            });
            return;
        }
        const fileBuffer = req.file.buffer;
        const fileHash = crypto_1.default.createHash('sha256').update(fileBuffer).digest('hex');
        const ext = path_1.default.extname(req.file.originalname) || '.png';
        const safeFileName = `cms_${Date.now()}_${crypto_1.default.randomBytes(4).toString('hex')}${ext}`;
        const storageKey = `public-media/${companyId}/${safeFileName}`;
        const storageProvider = (0, storage_1.getStorageProvider)();
        const uploadResult = await storageProvider.upload({
            companyId,
            applicationId: 'cms-public',
            documentType: 'cms_media',
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            buffer: fileBuffer,
            fileSize: req.file.size,
        });
        const publicUrl = uploadResult.storageKey ? `/uploads/${uploadResult.storageKey}` : `/uploads/${storageKey}`;
        const mediaRecord = await cms_service_1.CmsService.savePublicMedia(companyId, {
            fileName: safeFileName,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            storageProvider: storageProvider.constructor.name === 'S3Provider' ? 's3' : 'local',
            storageKey: uploadResult.storageKey || storageKey,
            publicUrl,
            fileHash,
            altText: altText || req.file.originalname,
            sectionKey: sectionKey || null,
        }, userId);
        res.status(201).json({
            message: 'Archivo multimedia subido correctamente.',
            media: mediaRecord,
        });
    }
    catch (err) {
        console.error('Error en uploadPublicMedia:', err);
        res.status(500).json({ error: 'Error al subir archivo multimedia.' });
    }
}
/**
 * GET /api/admin/portal/media
 * Galería de medios públicos disponibles
 */
async function getPublicMediaList(req, res) {
    try {
        const companyId = req.user.companyId;
        const sectionKey = req.query.sectionKey;
        const mediaList = await cms_service_1.CmsService.getPublicMediaGallery(companyId, sectionKey);
        res.json(mediaList);
    }
    catch (err) {
        console.error('Error en getPublicMediaList:', err);
        res.status(500).json({ error: 'Error al obtener galería de medios.' });
    }
}
/**
 * GET /api/public/content/:sectionKey
 * Endpoint público: Retorna contenido publicado (o fallback institucional)
 */
async function getPublicSectionContent(req, res) {
    try {
        const { sectionKey } = req.params;
        const content = await cms_service_1.CmsService.getPublicSection(sectionKey);
        res.json(content);
    }
    catch (err) {
        console.error('Error en getPublicSectionContent:', err);
        const fallback = cms_service_1.CmsService.getInstitutionalFallback(req.params.sectionKey);
        res.json(fallback);
    }
}
//# sourceMappingURL=cms.controller.js.map