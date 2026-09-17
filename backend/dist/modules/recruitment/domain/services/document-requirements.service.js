"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SERVICIO DE REQUISITOS DOCUMENTALES POR CONVOCATORIA (Fase 2.9.3)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentRequirementsService = void 0;
const db_1 = __importDefault(require("../../../../db"));
class DocumentRequirementsService {
    /**
     * Obtiene los requisitos documentales configurados para una convocatoria
     */
    static async getOpeningDocumentRequirements(jobOpeningId, companyId) {
        if (companyId && companyId !== 'default') {
            const result = await db_1.default.query(`SELECT * FROM opening_document_requirements
         WHERE job_opening_id = $1 AND company_id = $2 AND is_active = true
         ORDER BY order_index ASC`, [jobOpeningId, companyId]);
            return result.rows;
        }
        const result = await db_1.default.query(`SELECT * FROM opening_document_requirements
       WHERE job_opening_id = $1 AND is_active = true
       ORDER BY order_index ASC`, [jobOpeningId]);
        return result.rows;
    }
    /**
     * Crea un nuevo requisito documental para una convocatoria
     */
    static async createOpeningDocumentRequirement(data) {
        const result = await db_1.default.query(`INSERT INTO opening_document_requirements (
        company_id, job_opening_id, requirement_id, document_type, document_category,
        title, description, is_required, allow_multiple, max_files, order_index, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (company_id, job_opening_id, document_type, order_index)
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        is_required = EXCLUDED.is_required,
        allow_multiple = EXCLUDED.allow_multiple,
        max_files = EXCLUDED.max_files,
        is_active = true,
        updated_at = NOW()
      RETURNING *`, [
            data.companyId,
            data.jobOpeningId,
            data.requirementId || null,
            data.documentType,
            data.documentCategory,
            data.title,
            data.description || null,
            data.isRequired,
            data.allowMultiple,
            data.maxFiles || 1,
            data.orderIndex || 0,
            data.createdBy || null,
        ]);
        return result.rows[0];
    }
    /**
     * Actualiza un requisito documental existente
     */
    static async updateOpeningDocumentRequirement(id, companyId, data) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (data.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(data.title);
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(data.description);
        }
        if (data.isRequired !== undefined) {
            updates.push(`is_required = $${paramIndex++}`);
            values.push(data.isRequired);
        }
        if (data.allowMultiple !== undefined) {
            updates.push(`allow_multiple = $${paramIndex++}`);
            values.push(data.allowMultiple);
        }
        if (data.maxFiles !== undefined) {
            updates.push(`max_files = $${paramIndex++}`);
            values.push(data.maxFiles);
        }
        if (data.orderIndex !== undefined) {
            updates.push(`order_index = $${paramIndex++}`);
            values.push(data.orderIndex);
        }
        if (data.isActive !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            values.push(data.isActive);
        }
        updates.push(`updated_at = NOW()`);
        values.push(id);
        values.push(companyId);
        const result = await db_1.default.query(`UPDATE opening_document_requirements
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND company_id = $${paramIndex++}
       RETURNING *`, values);
        return result.rows[0];
    }
    /**
     * Elimina (desactiva) un requisito documental
     */
    static async deleteOpeningDocumentRequirement(id, companyId) {
        await db_1.default.query(`UPDATE opening_document_requirements
       SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND company_id = $2`, [id, companyId]);
    }
    /**
     * Obtiene el estado del expediente de una postulación
     */
    static async getExpedienteStatus(applicationId, companyId) {
        const result = await db_1.default.query(`SELECT * FROM expediente_status_view
       WHERE application_id = $1 AND company_id = $2`, [applicationId, companyId]);
        return result.rows[0];
    }
    /**
     * Calcula el progreso del expediente de una postulación
     */
    static async calculateExpedienteProgress(applicationId, companyId) {
        const result = await db_1.default.query(`SELECT calculate_expediente_progress($1, $2) AS progress`, [applicationId, companyId]);
        return result.rows[0].progress;
    }
    /**
     * Configura requisitos documentales predeterminados para una convocatoria
     * basado en el tipo de posición
     */
    static async setupDefaultDocumentRequirements(jobOpeningId, companyId, positionType, createdBy) {
        const defaultRequirements = this.getDefaultRequirementsForPosition(positionType);
        const created = [];
        for (const req of defaultRequirements) {
            const createdReq = await this.createOpeningDocumentRequirement({
                companyId,
                jobOpeningId,
                documentType: req.documentType,
                documentCategory: req.documentCategory,
                title: req.title,
                description: req.description,
                isRequired: req.isRequired,
                allowMultiple: req.allowMultiple,
                maxFiles: req.maxFiles,
                orderIndex: req.orderIndex,
                createdBy,
            });
            created.push(createdReq);
        }
        return created;
    }
    /**
     * Obtiene los requisitos documentales predeterminados según el tipo de posición
     */
    static getDefaultRequirementsForPosition(positionType) {
        const baseRequirements = [
            {
                documentType: 'DNI',
                documentCategory: 'IDENTIDAD',
                title: 'DNI / Carné de Identidad',
                description: 'Documento de identidad vigente',
                isRequired: true,
                allowMultiple: false,
                maxFiles: 1,
                orderIndex: 1,
            },
            {
                documentType: 'CUL',
                documentCategory: 'IDENTIDAD',
                title: 'Certificado Único Laboral (CUL)',
                description: 'Certificado que acredita la relación laboral',
                isRequired: true,
                allowMultiple: false,
                maxFiles: 1,
                orderIndex: 2,
            },
        ];
        const securityRequirements = [
            ...baseRequirements,
            {
                documentType: 'CERTIFICADO_ESTUDIOS',
                documentCategory: 'FORMACION_ACADEMICA',
                title: 'Certificado de Estudios',
                description: 'Certificado de estudios secundarios o superiores',
                isRequired: true,
                allowMultiple: false,
                maxFiles: 1,
                orderIndex: 3,
            },
            {
                documentType: 'CERTIFICADO_EXPERIENCIA',
                documentCategory: 'EXPERIENCIA_LABORAL',
                title: 'Certificados de Experiencia Laboral',
                description: 'Certificados que acrediten experiencia en seguridad',
                isRequired: true,
                allowMultiple: true,
                maxFiles: 5,
                orderIndex: 4,
            },
            {
                documentType: 'SUCAMEC',
                documentCategory: 'SEGURIDAD',
                title: 'Carné SUCAMEC Vigente',
                description: 'Carnet de seguridad privada vigente',
                isRequired: true,
                allowMultiple: false,
                maxFiles: 1,
                orderIndex: 5,
            },
            {
                documentType: 'LICENCIA_ARMAS',
                documentCategory: 'LICENCIAS',
                title: 'Licencia de Armas (Opcional)',
                description: 'Licencia de armas si aplica al puesto',
                isRequired: false,
                allowMultiple: false,
                maxFiles: 1,
                orderIndex: 6,
            },
            {
                documentType: 'BREVETE',
                documentCategory: 'LICENCIAS',
                title: 'Brevete de Conducir (Opcional)',
                description: 'Brevete vigente si requiere conducción',
                isRequired: false,
                allowMultiple: false,
                maxFiles: 1,
                orderIndex: 7,
            },
            {
                documentType: 'PRIMEROS_AUXILIOS',
                documentCategory: 'CAPACITACION',
                title: 'Certificado de Primeros Auxilios (Opcional)',
                description: 'Certificado de primeros auxilios vigente',
                isRequired: false,
                allowMultiple: false,
                maxFiles: 1,
                orderIndex: 8,
            },
        ];
        const generalRequirements = [
            ...baseRequirements,
            {
                documentType: 'CERTIFICADO_ESTUDIOS',
                documentCategory: 'FORMACION_ACADEMICA',
                title: 'Certificado de Estudios',
                description: 'Certificado de estudios correspondientes al nivel educativo',
                isRequired: true,
                allowMultiple: false,
                maxFiles: 1,
                orderIndex: 3,
            },
            {
                documentType: 'CERTIFICADO_EXPERIENCIA',
                documentCategory: 'EXPERIENCIA_LABORAL',
                title: 'Certificados de Experiencia Laboral',
                description: 'Certificados que acrediten experiencia laboral previa',
                isRequired: true,
                allowMultiple: true,
                maxFiles: 5,
                orderIndex: 4,
            },
        ];
        // Determinar qué requisitos usar según el tipo de posición
        if (positionType.toLowerCase().includes('seguridad') ||
            positionType.toLowerCase().includes('agente') ||
            positionType.toLowerCase().includes('vigilante')) {
            return securityRequirements;
        }
        return generalRequirements;
    }
}
exports.DocumentRequirementsService = DocumentRequirementsService;
//# sourceMappingURL=document-requirements.service.js.map