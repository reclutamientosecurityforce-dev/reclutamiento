/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SERVICIO DE REQUISITOS DOCUMENTALES POR CONVOCATORIA (Fase 2.9.3)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { OpeningDocumentRequirement, DocumentCategory, DocumentType } from '../../../../types';
export declare class DocumentRequirementsService {
    /**
     * Obtiene los requisitos documentales configurados para una convocatoria
     */
    static getOpeningDocumentRequirements(jobOpeningId: string, companyId?: string): Promise<OpeningDocumentRequirement[]>;
    /**
     * Crea un nuevo requisito documental para una convocatoria
     */
    static createOpeningDocumentRequirement(data: {
        companyId: string;
        jobOpeningId: string;
        requirementId?: string;
        documentType: DocumentType;
        documentCategory: DocumentCategory;
        title: string;
        description?: string;
        isRequired: boolean;
        allowMultiple: boolean;
        maxFiles?: number;
        orderIndex?: number;
        createdBy?: string;
    }): Promise<OpeningDocumentRequirement>;
    /**
     * Actualiza un requisito documental existente
     */
    static updateOpeningDocumentRequirement(id: string, companyId: string, data: Partial<{
        title: string;
        description: string;
        isRequired: boolean;
        allowMultiple: boolean;
        maxFiles: number;
        orderIndex: number;
        isActive: boolean;
    }>): Promise<OpeningDocumentRequirement>;
    /**
     * Elimina (desactiva) un requisito documental
     */
    static deleteOpeningDocumentRequirement(id: string, companyId: string): Promise<void>;
    /**
     * Obtiene el estado del expediente de una postulación
     */
    static getExpedienteStatus(applicationId: string, companyId: string): Promise<any>;
    /**
     * Calcula el progreso del expediente de una postulación
     */
    static calculateExpedienteProgress(applicationId: string, companyId: string): Promise<any>;
    /**
     * Configura requisitos documentales predeterminados para una convocatoria
     * basado en el tipo de posición
     */
    static setupDefaultDocumentRequirements(jobOpeningId: string, companyId: string, positionType: string, createdBy?: string): Promise<OpeningDocumentRequirement[]>;
    /**
     * Obtiene los requisitos documentales predeterminados según el tipo de posición
     */
    private static getDefaultRequirementsForPosition;
}
//# sourceMappingURL=document-requirements.service.d.ts.map