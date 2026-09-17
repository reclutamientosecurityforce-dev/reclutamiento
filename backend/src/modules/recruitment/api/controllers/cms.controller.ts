/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTROLADOR CMS DEL PORTAL PÚBLICO (Fase 2.8)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Request, Response } from 'express';
import { CmsService } from '../../domain/services/cms.service';
import { getStorageProvider } from '../../../../shared/storage';
import crypto from 'crypto';
import path from 'path';

/**
 * GET /api/admin/portal/sections
 * Lista todas las secciones configurables con su estado actual (draft / published)
 */
export async function getAdminSections(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const sections = await CmsService.getSections(companyId);
    res.json(sections);
  } catch (err) {
    console.error('Error en getAdminSections:', err);
    res.status(500).json({ error: 'Error al obtener secciones del portal.' });
  }
}

/**
 * GET /api/admin/portal/sections/:sectionKey
 * Obtiene el contenido de una sección para edición (preferDraft por defecto)
 */
export async function getAdminSectionByKey(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { sectionKey } = req.params;
    const preferDraft = req.query.preferDraft !== 'false';

    const section = await CmsService.getAdminSection(companyId, sectionKey, preferDraft);
    res.json(section);
  } catch (err) {
    console.error('Error en getAdminSectionByKey:', err);
    res.status(500).json({ error: 'Error al obtener sección.' });
  }
}

/**
 * PUT /api/admin/portal/sections/:sectionKey
 * Guarda los cambios como borrador (draft) sin afectar la versión pública
 */
export async function saveAdminDraft(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { sectionKey } = req.params;
    const { title, subtitle, description, content_data, media_urls } = req.body;

    const draft = await CmsService.saveDraft(
      companyId,
      sectionKey,
      {
        title,
        subtitle,
        description,
        content_data,
        media_urls,
      },
      userId
    );

    res.json({
      message: 'Borrador guardado exitosamente.',
      draft,
    });
  } catch (err) {
    console.error('Error en saveAdminDraft:', err);
    res.status(500).json({ error: 'Error al guardar borrador.' });
  }
}

/**
 * POST /api/admin/portal/sections/:sectionKey/publish
 * Publica la versión del borrador en vivo y genera entrada en el historial
 */
export async function publishAdminSection(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { sectionKey } = req.params;

    const published = await CmsService.publishSection(companyId, sectionKey, userId);

    res.json({
      message: 'Sección publicada exitosamente en el portal.',
      published,
    });
  } catch (err) {
    console.error('Error en publishAdminSection:', err);
    res.status(500).json({ error: 'Error al publicar sección.' });
  }
}

/**
 * GET /api/admin/portal/sections/:sectionKey/history
 * Obtiene el historial de versiones publicadas de la sección
 */
export async function getAdminSectionHistory(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const { sectionKey } = req.params;

    const history = await CmsService.getSectionHistory(companyId, sectionKey);
    res.json(history);
  } catch (err) {
    console.error('Error en getAdminSectionHistory:', err);
    res.status(500).json({ error: 'Error al obtener historial.' });
  }
}

/**
 * POST /api/admin/portal/sections/:sectionKey/restore/:version
 * Restaura una versión histórica anterior como nuevo borrador activo
 */
export async function restoreAdminSectionVersion(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { sectionKey, version } = req.params;

    const restoredDraft = await CmsService.restoreVersion(
      companyId,
      sectionKey,
      parseInt(version, 10),
      userId
    );

    res.json({
      message: `Versión ${version} restaurada como borrador para revisión.`,
      draft: restoredDraft,
    });
  } catch (err: any) {
    console.error('Error en restoreAdminSectionVersion:', err);
    res.status(400).json({ error: err.message || 'Error al restaurar versión.' });
  }
}

/**
 * POST /api/admin/portal/media
 * Sube un archivo multimedia público (imágenes de banners, héroes, logos)
 */
export async function uploadPublicMedia(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
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
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const ext = path.extname(req.file.originalname) || '.png';
    const safeFileName = `cms_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    const storageKey = `public-media/${companyId}/${safeFileName}`;

    const storageProvider = getStorageProvider();
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

    const mediaRecord = await CmsService.savePublicMedia(
      companyId,
      {
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
      },
      userId
    );

    res.status(201).json({
      message: 'Archivo multimedia subido correctamente.',
      media: mediaRecord,
    });
  } catch (err) {
    console.error('Error en uploadPublicMedia:', err);
    res.status(500).json({ error: 'Error al subir archivo multimedia.' });
  }
}

/**
 * GET /api/admin/portal/media
 * Galería de medios públicos disponibles
 */
export async function getPublicMediaList(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;
    const sectionKey = req.query.sectionKey as string | undefined;

    const mediaList = await CmsService.getPublicMediaGallery(companyId, sectionKey);
    res.json(mediaList);
  } catch (err) {
    console.error('Error en getPublicMediaList:', err);
    res.status(500).json({ error: 'Error al obtener galería de medios.' });
  }
}

/**
 * GET /api/public/content/:sectionKey
 * Endpoint público: Retorna contenido publicado (o fallback institucional)
 */
export async function getPublicSectionContent(req: Request, res: Response): Promise<void> {
  try {
    const { sectionKey } = req.params;
    const content = await CmsService.getPublicSection(sectionKey);
    res.json(content);
  } catch (err) {
    console.error('Error en getPublicSectionContent:', err);
    const fallback = CmsService.getInstitutionalFallback(req.params.sectionKey);
    res.json(fallback);
  }
}
