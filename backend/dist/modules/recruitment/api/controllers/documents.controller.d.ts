/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTROLADOR DE SEGURIDAD DOCUMENTAL Y DESCARGA CON ACL (Fase 2.7.1)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { Request, Response } from 'express';
/**
 * GET /api/recruitment/documents/:id/download
 * Descarga segura y controlada con verificación estricta de tenant (company_id) y ACL.
 */
export declare function downloadDocument(req: Request, res: Response): Promise<void>;
/**
 * GET /api/recruitment/documents/:id/signed-url
 * Genera una URL firmada con tiempo de expiración configurable para el visor seguro.
 */
export declare function getSignedDocumentUrl(req: Request, res: Response): Promise<void>;
/**
 * GET /api/recruitment/documents/resolve-signed-url?token=...
 * Endpoint público efímero que valida el token firmado emitido por LocalDiskProvider.
 */
export declare function resolveSignedUrl(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=documents.controller.d.ts.map