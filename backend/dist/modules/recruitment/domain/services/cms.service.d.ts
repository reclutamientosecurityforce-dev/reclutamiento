/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SERVICIO CMS DEL PORTAL PÚBLICO INSTITUCIONAL (Fase 2.8)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
export interface PortalSectionRecord {
    id: string;
    company_id: string;
    section_key: string;
    status: 'draft' | 'published' | 'archived';
    version: number;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    content_data: any;
    media_urls: any;
    created_by?: string | null;
    updated_by?: string | null;
    published_by?: string | null;
    created_at: string;
    updated_at: string;
    published_at?: string | null;
}
export interface PortalSectionHistoryRecord {
    id: string;
    company_id: string;
    section_key: string;
    version: number;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    content_data: any;
    media_urls: any;
    published_by?: string | null;
    published_at: string;
    restored_at?: string | null;
}
export interface PortalMediaRecord {
    id: string;
    company_id: string;
    file_name: string;
    original_name: string;
    mime_type: string;
    file_size: number;
    storage_provider: string;
    storage_key: string;
    public_url: string;
    file_hash: string | null;
    alt_text: string | null;
    section_key: string | null;
    uploaded_by?: string | null;
    created_at: string;
}
export declare class CmsService {
    /**
     * Obtiene la lista de todas las secciones registradas para una empresa con sus estados
     */
    static getSections(companyId: string): Promise<any[]>;
    /**
     * Obtiene una sección específica para administración (permite preferDraft)
     */
    static getAdminSection(companyId: string, sectionKey: string, preferDraft?: boolean): Promise<{
        data: any;
        status: 'draft' | 'published' | 'fallback';
        version: number;
        has_draft: boolean;
    }>;
    /**
     * Guarda o actualiza un borrador (draft) de una sección
     */
    static saveDraft(companyId: string, sectionKey: string, data: {
        title?: string;
        subtitle?: string;
        description?: string;
        content_data?: any;
        media_urls?: any;
    }, userId: string): Promise<PortalSectionRecord>;
    /**
     * Publica una sección (traslada draft a published, incrementa versión e inserta en historial)
     */
    static publishSection(companyId: string, sectionKey: string, userId: string): Promise<PortalSectionRecord>;
    /**
     * Obtiene el historial de versiones publicadas de una sección
     */
    static getSectionHistory(companyId: string, sectionKey: string): Promise<PortalSectionHistoryRecord[]>;
    /**
     * Restaura una versión anterior del historial colocándola como nuevo borrador activo
     */
    static restoreVersion(companyId: string, sectionKey: string, version: number, userId: string): Promise<PortalSectionRecord>;
    /**
     * Obtiene el contenido publicado para el portal público (solo status = 'published' o fallback institucional)
     */
    static getPublicSection(sectionKey: string): Promise<any>;
    /**
     * Registra un medio público subido (portal_media)
     */
    static savePublicMedia(companyId: string, mediaData: {
        fileName: string;
        originalName: string;
        mimeType: string;
        fileSize: number;
        storageProvider: string;
        storageKey: string;
        publicUrl: string;
        fileHash?: string;
        altText?: string;
        sectionKey?: string;
    }, userId: string): Promise<PortalMediaRecord>;
    /**
     * Obtiene la galería de medios públicos de una empresa
     */
    static getPublicMediaGallery(companyId: string, sectionKey?: string): Promise<PortalMediaRecord[]>;
    /**
     * Fallback institucional seguro (Idéntico a la identidad actual del portal)
     */
    static getInstitutionalFallback(sectionKey: string): any;
    /**
     * Helper de registro de auditoría
     */
    private static logAudit;
}
//# sourceMappingURL=cms.service.d.ts.map