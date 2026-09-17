/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTROLADOR CMS DEL PORTAL PÚBLICO (Fase 2.8)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { Request, Response } from 'express';
/**
 * GET /api/admin/portal/sections
 * Lista todas las secciones configurables con su estado actual (draft / published)
 */
export declare function getAdminSections(req: Request, res: Response): Promise<void>;
/**
 * GET /api/admin/portal/sections/:sectionKey
 * Obtiene el contenido de una sección para edición (preferDraft por defecto)
 */
export declare function getAdminSectionByKey(req: Request, res: Response): Promise<void>;
/**
 * PUT /api/admin/portal/sections/:sectionKey
 * Guarda los cambios como borrador (draft) sin afectar la versión pública
 */
export declare function saveAdminDraft(req: Request, res: Response): Promise<void>;
/**
 * POST /api/admin/portal/sections/:sectionKey/publish
 * Publica la versión del borrador en vivo y genera entrada en el historial
 */
export declare function publishAdminSection(req: Request, res: Response): Promise<void>;
/**
 * GET /api/admin/portal/sections/:sectionKey/history
 * Obtiene el historial de versiones publicadas de la sección
 */
export declare function getAdminSectionHistory(req: Request, res: Response): Promise<void>;
/**
 * POST /api/admin/portal/sections/:sectionKey/restore/:version
 * Restaura una versión histórica anterior como nuevo borrador activo
 */
export declare function restoreAdminSectionVersion(req: Request, res: Response): Promise<void>;
/**
 * POST /api/admin/portal/media
 * Sube un archivo multimedia público (imágenes de banners, héroes, logos)
 */
export declare function uploadPublicMedia(req: Request, res: Response): Promise<void>;
/**
 * GET /api/admin/portal/media
 * Galería de medios públicos disponibles
 */
export declare function getPublicMediaList(req: Request, res: Response): Promise<void>;
/**
 * GET /api/public/content/:sectionKey
 * Endpoint público: Retorna contenido publicado (o fallback institucional)
 */
export declare function getPublicSectionContent(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=cms.controller.d.ts.map