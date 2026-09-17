/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRUEBAS: EXPEDIENTE DIGITAL INTELIGENTE (Fase 2.9.3)
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { DocumentRequirementsService } from '../modules/recruitment/domain/services/document-requirements.service';
import db from '../db';

describe('Expediente Digital Inteligente - Fase 2.9.3', () => {
  let testCompanyId: string;
  let testOpeningId: string;
  let testApplicationId: string;

  beforeAll(async () => {
    // Limpiar datos existentes primero
    await db.query("DELETE FROM companies WHERE ruc = '20123456789'");
    
    // Crear datos de prueba
    const companyResult = await db.query(
      `INSERT INTO companies (name, ruc) VALUES ('Test Company', '20123456789') RETURNING id`
    );
    testCompanyId = companyResult.rows[0].id;

    const openingResult = await db.query(
      `INSERT INTO job_openings (company_id, title, position_type, location, vacancies_count)
       VALUES ($1, 'Agente de Seguridad', 'Agente', 'Lima', 5) RETURNING id`,
      [testCompanyId]
    );
    testOpeningId = openingResult.rows[0].id;

    const candidateResult = await db.query(
      `INSERT INTO candidates (company_id, document_type, document_number, first_name, last_name, phone)
       VALUES ($1, 'DNI', '12345678', 'Juan', 'Pérez', '987654321') RETURNING id`,
      [testCompanyId]
    );

    const applicationResult = await db.query(
      `INSERT INTO applications (company_id, candidate_id, job_opening_id, application_code, draft_token)
       VALUES ($1, $2, $3, 'TEST-001', 'test-token-123') RETURNING id`,
      [testCompanyId, candidateResult.rows[0].id, testOpeningId]
    );
    testApplicationId = applicationResult.rows[0].id;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    try {
      await db.query('DELETE FROM application_documents WHERE application_id = $1', [testApplicationId]);
    } catch (e) {
      // Tabla puede no existir aún
    }
    await db.query('DELETE FROM applications WHERE id = $1', [testApplicationId]);
    await db.query('DELETE FROM candidates WHERE id = (SELECT candidate_id FROM applications WHERE id = $1)', [testApplicationId]);
    try {
      await db.query('DELETE FROM opening_document_requirements WHERE job_opening_id = $1', [testOpeningId]);
    } catch (e) {
      // Tabla puede no existir aún
    }
    await db.query('DELETE FROM job_openings WHERE id = $1', [testOpeningId]);
    await db.query('DELETE FROM companies WHERE id = $1', [testCompanyId]);
  });

  describe('Prueba 1: Convocatoria con 3 documentos obligatorios', () => {
    it('debe crear 3 requisitos documentales obligatorios', async () => {
      const req1 = await DocumentRequirementsService.createOpeningDocumentRequirement({
        companyId: testCompanyId,
        jobOpeningId: testOpeningId,
        documentType: 'DNI',
        documentCategory: 'IDENTIDAD',
        title: 'DNI / Carné de Identidad',
        description: 'Documento de identidad vigente',
        isRequired: true,
        allowMultiple: false,
        maxFiles: 1,
        orderIndex: 1,
      });

      const req2 = await DocumentRequirementsService.createOpeningDocumentRequirement({
        companyId: testCompanyId,
        jobOpeningId: testOpeningId,
        documentType: 'CUL',
        documentCategory: 'IDENTIDAD',
        title: 'Certificado Único Laboral',
        description: 'Certificado laboral',
        isRequired: true,
        allowMultiple: false,
        maxFiles: 1,
        orderIndex: 2,
      });

      const req3 = await DocumentRequirementsService.createOpeningDocumentRequirement({
        companyId: testCompanyId,
        jobOpeningId: testOpeningId,
        documentType: 'SUCAMEC',
        documentCategory: 'SEGURIDAD',
        title: 'Carné SUCAMEC',
        description: 'Carnet de seguridad',
        isRequired: true,
        allowMultiple: false,
        maxFiles: 1,
        orderIndex: 3,
      });

      const requirements = await DocumentRequirementsService.getOpeningDocumentRequirements(
        testOpeningId,
        testCompanyId
      );

      expect(requirements).toHaveLength(3);
      expect(requirements.every(req => req.is_required)).toBe(true);
    });
  });

  describe('Prueba 2: Convocatoria con 8 documentos', () => {
    it('debe crear 8 requisitos documentales variados', async () => {
      const documentTypes = [
        'DNI', 'CUL', 'CERTIFICADO_ESTUDIOS', 'CERTIFICADO_EXPERIENCIA',
        'SUCAMEC', 'LICENCIA_ARMAS', 'BREVETE', 'PRIMEROS_AUXILIOS'
      ];

      for (let i = 0; i < documentTypes.length; i++) {
        await DocumentRequirementsService.createOpeningDocumentRequirement({
          companyId: testCompanyId,
          jobOpeningId: testOpeningId,
          documentType: documentTypes[i] as any,
          documentCategory: i < 2 ? 'IDENTIDAD' : i < 4 ? 'FORMACION_ACADEMICA' : 'SEGURIDAD',
          title: `Documento ${i + 1}`,
          isRequired: i < 5,
          allowMultiple: i === 3, // EXPERIENCIA permite múltiples
          maxFiles: i === 3 ? 5 : 1,
          orderIndex: i + 1,
        });
      }

      const requirements = await DocumentRequirementsService.getOpeningDocumentRequirements(
        testOpeningId,
        testCompanyId
      );

      expect(requirements.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Prueba 3: Documentos opcionales', () => {
    it('debe crear documentos opcionales correctamente', async () => {
      const optionalReq = await DocumentRequirementsService.createOpeningDocumentRequirement({
        companyId: testCompanyId,
        jobOpeningId: testOpeningId,
        documentType: 'LICENCIA_ARMAS',
        documentCategory: 'LICENCIAS',
        title: 'Licencia de Armas (Opcional)',
        description: 'Solo si aplica al puesto',
        isRequired: false,
        allowMultiple: false,
        maxFiles: 1,
        orderIndex: 10,
      });

      expect(optionalReq.is_required).toBe(false);

      const requirements = await DocumentRequirementsService.getOpeningDocumentRequirements(
        testOpeningId,
        testCompanyId
      );

      const optionalDocs = requirements.filter(req => !req.is_required);
      expect(optionalDocs.length).toBeGreaterThan(0);
    });
  });

  describe('Prueba 4: Múltiples certificados de experiencia', () => {
    it('debe permitir múltiples archivos para experiencia', async () => {
      const expReq = await DocumentRequirementsService.createOpeningDocumentRequirement({
        companyId: testCompanyId,
        jobOpeningId: testOpeningId,
        documentType: 'CERTIFICADO_EXPERIENCIA',
        documentCategory: 'EXPERIENCIA_LABORAL',
        title: 'Certificados de Experiencia',
        description: 'Hasta 5 certificados',
        isRequired: true,
        allowMultiple: true,
        maxFiles: 5,
        orderIndex: 4,
      });

      expect(expReq.allow_multiple).toBe(true);
      expect(expReq.max_files).toBe(5);
    });
  });

  describe('Prueba 5: Cálculo de progreso del expediente', () => {
    it('debe calcular el progreso correctamente', async () => {
      const progress = await DocumentRequirementsService.calculateExpedienteProgress(
        testApplicationId,
        testCompanyId
      );

      expect(progress).toHaveProperty('total_required');
      expect(progress).toHaveProperty('required_completed');
      expect(progress).toHaveProperty('expediente_score');
      expect(progress).toHaveProperty('progress_percentage');
      expect(progress).toHaveProperty('is_complete');
    });
  });

  describe('Prueba 6: Estado del expediente', () => {
    it('debe obtener el estado completo del expediente', async () => {
      const status = await DocumentRequirementsService.getExpedienteStatus(
        testApplicationId,
        testCompanyId
      );

      expect(status).toHaveProperty('application_id');
      expect(status).toHaveProperty('expediente_progress');
      expect(status).toHaveProperty('documents_verified');
      expect(status).toHaveProperty('documents_pending');
    });
  });

  describe('Prueba 7: Requisitos predeterminados para posición de seguridad', () => {
    it('debe configurar requisitos predeterminados para agente de seguridad', async () => {
      const defaultReqs = await DocumentRequirementsService.setupDefaultDocumentRequirements(
        testOpeningId,
        testCompanyId,
        'Agente de Seguridad'
      );

      expect(defaultReqs.length).toBeGreaterThan(0);
      
      const dniReq = defaultReqs.find(req => req.document_type === 'DNI');
      expect(dniReq).toBeDefined();
      expect(dniReq?.is_required).toBe(true);

      const sucamecReq = defaultReqs.find(req => req.document_type === 'SUCAMEC');
      expect(sucamecReq).toBeDefined();
      expect(sucamecReq?.is_required).toBe(true);
    });
  });

  describe('Prueba 8: Actualización de requisitos', () => {
    it('debe actualizar un requisito documental existente', async () => {
      const reqs = await DocumentRequirementsService.getOpeningDocumentRequirements(
        testOpeningId,
        testCompanyId
      );

      if (reqs.length > 0) {
        const updated = await DocumentRequirementsService.updateOpeningDocumentRequirement(
          reqs[0].id,
          testCompanyId,
          { title: 'Documento Actualizado', isRequired: false }
        );

        expect(updated.title).toBe('Documento Actualizado');
        expect(updated.is_required).toBe(false);
      }
    });
  });

  describe('Prueba 9: Eliminación de requisitos', () => {
    it('debe desactivar un requisito documental', async () => {
      const reqs = await DocumentRequirementsService.getOpeningDocumentRequirements(
        testOpeningId,
        testCompanyId
      );

      if (reqs.length > 0) {
        await DocumentRequirementsService.deleteOpeningDocumentRequirement(
          reqs[0].id,
          testCompanyId
        );

        const updatedReqs = await DocumentRequirementsService.getOpeningDocumentRequirements(
          testOpeningId,
          testCompanyId
        );

        const deletedReq = updatedReqs.find(req => req.id === reqs[0].id);
        expect(deletedReq).toBeUndefined();
      }
    });
  });

  describe('Prueba 10: Validación de tipos documentales', () => {
    it('debe aceptar tipos documentales válidos', async () => {
      const validTypes = [
        'DNI', 'CE', 'CUL', 'CERTIFICADO_ESTUDIOS', 'CERTIFICADO_EXPERIENCIA',
        'SUCAMEC', 'LICENCIA_ARMAS', 'BREVETE', 'PRIMEROS_AUXILIOS'
      ];

      for (const type of validTypes) {
        const req = await DocumentRequirementsService.createOpeningDocumentRequirement({
          companyId: testCompanyId,
          jobOpeningId: testOpeningId,
          documentType: type as any,
          documentCategory: 'IDENTIDAD',
          title: `Test ${type}`,
          isRequired: true,
          allowMultiple: false,
          maxFiles: 1,
          orderIndex: 99,
        });

        expect(req.document_type).toBe(type);
      }
    });
  });
});