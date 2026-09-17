/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SERVICIO DE REQUISITOS DOCUMENTALES POR CONVOCATORIA (Fase 2.9.3)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import db from '../../../../db';
import { OpeningDocumentRequirement, DocumentCategory, DocumentType } from '../../../../types';

export class DocumentRequirementsService {
  /**
   * Obtiene los requisitos documentales configurados para una convocatoria
   */
  static async getOpeningDocumentRequirements(
    jobOpeningId: string,
    companyId?: string
  ): Promise<OpeningDocumentRequirement[]> {
    if (companyId && companyId !== 'default') {
      const result = await db.query<OpeningDocumentRequirement>(
        `SELECT * FROM opening_document_requirements
         WHERE job_opening_id = $1 AND company_id = $2 AND is_active = true
         ORDER BY order_index ASC`,
        [jobOpeningId, companyId]
      );
      return result.rows;
    }
    const result = await db.query<OpeningDocumentRequirement>(
      `SELECT * FROM opening_document_requirements
       WHERE job_opening_id = $1 AND is_active = true
       ORDER BY order_index ASC`,
      [jobOpeningId]
    );
    return result.rows;
  }

  /**
   * Crea un nuevo requisito documental para una convocatoria
   */
  static async createOpeningDocumentRequirement(
    data: {
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
    }
  ): Promise<OpeningDocumentRequirement> {
    const result = await db.query<OpeningDocumentRequirement>(
      `INSERT INTO opening_document_requirements (
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
      RETURNING *`,
      [
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
      ]
    );
    return result.rows[0];
  }

  /**
   * Actualiza un requisito documental existente
   */
  static async updateOpeningDocumentRequirement(
    id: string,
    companyId: string,
    data: Partial<{
      title: string;
      description: string;
      isRequired: boolean;
      allowMultiple: boolean;
      maxFiles: number;
      orderIndex: number;
      isActive: boolean;
    }>
  ): Promise<OpeningDocumentRequirement> {
    const updates: string[] = [];
    const values: any[] = [];
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

    const result = await db.query<OpeningDocumentRequirement>(
      `UPDATE opening_document_requirements
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND company_id = $${paramIndex++}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  /**
   * Elimina (desactiva) un requisito documental
   */
  static async deleteOpeningDocumentRequirement(
    id: string,
    companyId: string
  ): Promise<void> {
    await db.query(
      `UPDATE opening_document_requirements
       SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );
  }

  /**
   * Obtiene el estado del expediente de una postulación
   */
  static async getExpedienteStatus(
    applicationId: string,
    companyId: string
  ): Promise<any> {
    const result = await db.query(
      `SELECT * FROM expediente_status_view
       WHERE application_id = $1 AND company_id = $2`,
      [applicationId, companyId]
    );
    return result.rows[0];
  }

  /**
   * Calcula el progreso del expediente de una postulación
   */
  static async calculateExpedienteProgress(
    applicationId: string,
    companyId: string
  ): Promise<any> {
    const result = await db.query(
      `SELECT calculate_expediente_progress($1, $2) AS progress`,
      [applicationId, companyId]
    );
    return result.rows[0].progress;
  }

  /**
   * Configura requisitos documentales predeterminados para una convocatoria
   * basado en el tipo de posición
   */
  static async setupDefaultDocumentRequirements(
    jobOpeningId: string,
    companyId: string,
    positionType: string,
    createdBy?: string
  ): Promise<OpeningDocumentRequirement[]> {
    const defaultRequirements = this.getDefaultRequirementsForPosition(positionType);
    const created: OpeningDocumentRequirement[] = [];

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
  private static getDefaultRequirementsForPosition(positionType: string): Array<{
    documentType: DocumentType;
    documentCategory: DocumentCategory;
    title: string;
    description?: string;
    isRequired: boolean;
    allowMultiple: boolean;
    maxFiles: number;
    orderIndex: number;
  }> {
    const baseRequirements = [
      {
        documentType: 'DNI' as DocumentType,
        documentCategory: 'IDENTIDAD' as DocumentCategory,
        title: 'DNI / Carné de Identidad',
        description: 'Documento de identidad vigente',
        isRequired: true,
        allowMultiple: false,
        maxFiles: 1,
        orderIndex: 1,
      },
      {
        documentType: 'CUL' as DocumentType,
        documentCategory: 'IDENTIDAD' as DocumentCategory,
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
        documentType: 'CERTIFICADO_ESTUDIOS' as DocumentType,
        documentCategory: 'FORMACION_ACADEMICA' as DocumentCategory,
        title: 'Certificado de Estudios',
        description: 'Certificado de estudios secundarios o superiores',
        isRequired: true,
        allowMultiple: false,
        maxFiles: 1,
        orderIndex: 3,
      },
      {
        documentType: 'CERTIFICADO_EXPERIENCIA' as DocumentType,
        documentCategory: 'EXPERIENCIA_LABORAL' as DocumentCategory,
        title: 'Certificados de Experiencia Laboral',
        description: 'Certificados que acrediten experiencia en seguridad',
        isRequired: true,
        allowMultiple: true,
        maxFiles: 5,
        orderIndex: 4,
      },
      {
        documentType: 'SUCAMEC' as DocumentType,
        documentCategory: 'SEGURIDAD' as DocumentCategory,
        title: 'Carné SUCAMEC Vigente',
        description: 'Carnet de seguridad privada vigente',
        isRequired: true,
        allowMultiple: false,
        maxFiles: 1,
        orderIndex: 5,
      },
      {
        documentType: 'LICENCIA_ARMAS' as DocumentType,
        documentCategory: 'LICENCIAS' as DocumentCategory,
        title: 'Licencia de Armas (Opcional)',
        description: 'Licencia de armas si aplica al puesto',
        isRequired: false,
        allowMultiple: false,
        maxFiles: 1,
        orderIndex: 6,
      },
      {
        documentType: 'BREVETE' as DocumentType,
        documentCategory: 'LICENCIAS' as DocumentCategory,
        title: 'Brevete de Conducir (Opcional)',
        description: 'Brevete vigente si requiere conducción',
        isRequired: false,
        allowMultiple: false,
        maxFiles: 1,
        orderIndex: 7,
      },
      {
        documentType: 'PRIMEROS_AUXILIOS' as DocumentType,
        documentCategory: 'CAPACITACION' as DocumentCategory,
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
        documentType: 'CERTIFICADO_ESTUDIOS' as DocumentType,
        documentCategory: 'FORMACION_ACADEMICA' as DocumentCategory,
        title: 'Certificado de Estudios',
        description: 'Certificado de estudios correspondientes al nivel educativo',
        isRequired: true,
        allowMultiple: false,
        maxFiles: 1,
        orderIndex: 3,
      },
      {
        documentType: 'CERTIFICADO_EXPERIENCIA' as DocumentType,
        documentCategory: 'EXPERIENCIA_LABORAL' as DocumentCategory,
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