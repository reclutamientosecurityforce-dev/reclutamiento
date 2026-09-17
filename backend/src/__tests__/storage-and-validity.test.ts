/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SUITE DE TESTS: FASE 2.7.1 — STORAGE PROVIDER, ACL Y POLÍTICA DE VIGENCIA
 * Security Force P&V S.A.C.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import fs from 'fs';
import path from 'path';
import { LocalDiskStorageProvider } from '../shared/storage/local-disk.provider';
import { DocumentValidityPolicy } from '../modules/recruitment/domain/validity/document-validity.policy';
import { EvaluationEngine } from '../modules/recruitment/domain/evaluation.engine';
import { Application, Candidate, JobOpening, OpeningRequirement, ApplicationDocument } from '../types';

describe('FASE 2.7.1: Storage Provider & Seguridad Documental', () => {
  const testUploadsDir = path.join(process.cwd(), 'uploads_test');
  let storage: LocalDiskStorageProvider;

  beforeAll(() => {
    storage = new LocalDiskStorageProvider(testUploadsDir);
  });

  afterAll(() => {
    // Limpieza de directorio de prueba
    if (fs.existsSync(testUploadsDir)) {
      fs.rmSync(testUploadsDir, { recursive: true, force: true });
    }
  });

  test('1. LocalDiskStorageProvider debe subir archivo, crear carpetas aisladas y calcular SHA-256', async () => {
    const testBuffer = Buffer.from('CONTENIDO_DE_PRUEBA_CV_SECURITY_FORCE_2026');
    const result = await storage.upload({
      companyId: 'company-uuid-1',
      applicationId: 'app-uuid-1',
      documentType: 'cv',
      originalName: 'mi_curriculum.pdf',
      mimeType: 'application/pdf',
      buffer: testBuffer,
    });

    expect(result.storageProvider).toBe('local');
    expect(result.storageKey).toContain('companies/company-uuid-1/app-uuid-1/cv_');
    expect(result.fileHash).toBeDefined();
    expect(result.fileHash.length).toBe(64); // SHA-256 hex
    expect(result.fileSize).toBe(testBuffer.length);

    // Verificar existencia física
    const exists = await storage.exists(result.storageKey);
    expect(exists).toBe(true);

    // Verificar stream de lectura
    const streamRes = await storage.getFileStream(result.storageKey);
    expect(streamRes.stream).toBeDefined();
    expect(streamRes.size).toBe(testBuffer.length);

    await new Promise<void>((resolve, reject) => {
      streamRes.stream.on('data', () => {});
      streamRes.stream.on('end', () => resolve());
      streamRes.stream.on('error', (err) => reject(err));
    });
  });

  test('2. LocalDiskStorageProvider debe generar Signed URL efímera con token válido', async () => {
    const signedUrl = await storage.getSignedDownloadUrl('companies/company-uuid-1/app-uuid-1/cv_test.pdf', 'cv.pdf', 300);
    expect(signedUrl).toContain('/api/recruitment/documents/resolve-signed-url?token=');
    expect(signedUrl).toContain('token=');
  });

  test('3. LocalDiskStorageProvider debe eliminar archivos físicamente', async () => {
    const testBuffer = Buffer.from('ARCHIVO_A_ELIMINAR');
    const result = await storage.upload({
      companyId: 'company-uuid-1',
      applicationId: 'app-uuid-1',
      documentType: 'temp_doc',
      originalName: 'temp.txt',
      mimeType: 'text/plain',
      buffer: testBuffer,
    });

    expect(await storage.exists(result.storageKey)).toBe(true);
    const deleted = await storage.delete(result.storageKey);
    expect(deleted).toBe(true);
    expect(await storage.exists(result.storageKey)).toBe(false);
  });
});

describe('FASE 2.7.1: Política Centralizada de Vigencia (DocumentValidityPolicy)', () => {
  test('1. Documento vence en el futuro lejano -> debe ser VIGENTE', () => {
    const futureDate = '2030-12-31';
    const evalRes = DocumentValidityPolicy.evaluateValidity(futureDate, {
      referenceDate: new Date('2026-08-19T12:00:00Z'),
    });

    expect(evalRes.status).toBe('valid');
    expect(evalRes.isExpired).toBe(false);
    expect(evalRes.daysRemaining).toBeGreaterThan(365);
  });

  test('2. Documento que vence exactamente HOY -> debe permanecer VIGENTE durante todo el día (hasta 23:59:59)', () => {
    const todayStr = '2026-08-19';
    // Referencia al mediodía de hoy
    const middayToday = new Date('2026-08-19T17:00:00Z'); // 12:00 hora Lima (UTC-5)
    const evalRes = DocumentValidityPolicy.evaluateValidity(todayStr, {
      referenceDate: middayToday,
    });

    expect(evalRes.isExpired).toBe(false);
    expect(evalRes.status).toBe('expiring_soon'); // Le quedan 0 días pero sigue vigente hoy
  });

  test('3. Documento vencido AYER -> debe ser EXPIRED', () => {
    const yesterdayStr = '2026-08-18';
    const today = new Date('2026-08-19T17:00:00Z');
    const evalRes = DocumentValidityPolicy.evaluateValidity(yesterdayStr, {
      referenceDate: today,
    });

    expect(evalRes.status).toBe('expired');
    expect(evalRes.isExpired).toBe(true);
  });

  test('4. Documento sin fecha especificada -> debe ser UNDETERMINED', () => {
    const evalRes = DocumentValidityPolicy.evaluateValidity(null);
    expect(evalRes.status).toBe('undetermined');
    expect(evalRes.isExpired).toBe(false);
  });

  test('5. Documento que vence dentro de 15 días -> debe ser EXPIRING_SOON', () => {
    const referenceDate = new Date('2026-08-01T12:00:00Z');
    const expiryDate = '2026-08-15';
    const evalRes = DocumentValidityPolicy.evaluateValidity(expiryDate, {
      referenceDate,
      thresholdDays: 30,
    });

    expect(evalRes.status).toBe('expiring_soon');
    expect(evalRes.isExpiringSoon).toBe(true);
    expect(evalRes.daysRemaining).toBe(14);
  });
});

describe('FASE 2.7.1: Discrepancias Contextuales en el Motor de Evaluación', () => {
  const baseCandidate: Candidate = {
    id: 'cand-1',
    company_id: 'comp-1',
    document_type: 'DNI',
    document_number: '12345678',
    first_name: 'Juan',
    last_name: 'Pérez',
    phone: '999888777',
    city: 'Lima',
    sucamec_status: 'valid',
    sucamec_expires_at: '2028-12-31',
    gun_license: false,
    driver_license: false,
    military_service: false,
    height_cm: 172,
    birth_date: '1995-05-15',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const baseOpening: JobOpening = {
    id: 'open-1',
    company_id: 'comp-1',
    title: 'Agente de Seguridad',
    position_type: 'agent',
    location: 'Lima',
    status: 'open',
    vacancies_count: 5,
    filled_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const experienceRequirement: OpeningRequirement = {
    id: 'req-exp',
    company_id: 'comp-1',
    job_opening_id: 'open-1',
    version: 1,
    code: 'EXP_TOTAL',
    title: 'Experiencia Total en Seguridad',
    requirement_type: 'eliminatory_scoreable',
    rule_type: 'experience_total',
    rule_config: { minMonths: 12, maxScoreMonths: 36 },
    weight_score: 30,
    order_index: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const baseApplication: Application = {
    id: 'app-1',
    company_id: 'comp-1',
    candidate_id: 'cand-1',
    job_opening_id: 'open-1',
    application_status: 'submitted',
    progress_percentage: 100,
    prefilter_status: 'pending',
    prefilter_score: 0,
    total_accredited_exp_months: 0,
    total_declared_exp_months: 0,
    discrepancies_count: 0,
    current_stage: 'registered',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  test('1. Caso Crítico: Declaró 2 años (24m), pero acreditó 8 meses con requisito de 12m -> Severidad HIGH y estado REVIEW', () => {
    const candidateWithGap: Candidate = {
      ...baseCandidate,
      security_experience_years: 2, // declara 24 meses
      structured_profile: {
        experiences: [
          { company: 'Empresa A', position: 'Agente', startDate: '2024-01-01', endDate: '2024-08-31' }, // 8 meses
        ],
        education: [],
        courses: [],
        skills: [],
      },
    };

    const docsWithWorkCert: ApplicationDocument[] = [
      { id: 'd1', company_id: 'comp-1', application_id: 'app-1', document_type: 'cert_trabajo', file_name: 'cert.pdf', file_path: '/c.pdf', status: 'verified', uploaded_at: '' },
    ];

    const result = EvaluationEngine.evaluate({
      application: baseApplication,
      candidate: candidateWithGap,
      opening: baseOpening,
      requirements: [experienceRequirement],
      documents: docsWithWorkCert,
    });

    // La discrepancia altera la elegibilidad (acreditado 8m < 12m)
    expect(result.discrepancies.length).toBeGreaterThan(0);
    const expDiscrepancy = result.discrepancies.find((d) => d.field === 'security_experience_years');
    expect(expDiscrepancy).toBeDefined();
    expect(expDiscrepancy?.severity).toBe('high');
    expect(result.prefilterStatus).toBe('ineligible'); // Falló requisito eliminatorio de 12m
  });

  test('2. Caso No Crítico: Declaró 10 años (120m) y acredita 9 años (108m) con requisito de 12m -> Severidad LOW / Informativa', () => {
    const candidateHighExp: Candidate = {
      ...baseCandidate,
      security_experience_years: 10, // declara 120m
      structured_profile: {
        experiences: [
          { company: 'Empresa Alpha', position: 'Agente', startDate: '2015-01-01', endDate: '2023-12-31' }, // 108 meses (9 años)
        ],
        education: [],
        courses: [],
        skills: [],
      },
    };

    const docs: ApplicationDocument[] = [
      { id: 'd1', company_id: 'comp-1', application_id: 'app-1', document_type: 'cert_trabajo', file_name: 'cert.pdf', file_path: '/c.pdf', status: 'verified', uploaded_at: '' },
      { id: 'd2', company_id: 'comp-1', application_id: 'app-1', document_type: 'cul', file_name: 'cul.pdf', file_path: '/cul.pdf', status: 'verified', uploaded_at: '' },
    ];

    const result = EvaluationEngine.evaluate({
      application: baseApplication,
      candidate: candidateHighExp,
      opening: baseOpening,
      requirements: [experienceRequirement],
      documents: docs,
    });

    // Supera con creces el requisito de 12m (acreditó 108m)
    const expDiscrepancy = result.discrepancies.find((d) => d.field === 'security_experience_years');
    expect(expDiscrepancy).toBeDefined();
    expect(expDiscrepancy?.severity).toBe('low'); // No es crítico
    expect(result.prefilterStatus).toBe('eligible'); // Sigue siendo APTO
  });
});
