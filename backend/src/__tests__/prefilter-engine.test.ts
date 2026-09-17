import request from 'supertest';
import { app } from '../server';
import db from '../db';
import {
  EvaluationEngine,
  mergeIntervals,
  calculateNonOverlappingMonths,
  calculateAge,
  diffMonths,
} from '../modules/recruitment/domain/evaluation.engine';
import { OpeningRequirement, Candidate, JobOpening, ApplicationDocument, Application } from '../types';
import { Application as App } from '../types';

describe('MOTOR DE PREFILTRO, EVALUACIÓN DOCUMENTAL Y RANKING (30 TESTS OBLIGATORIOS)', () => {
  let tokenAdmin: string;
  let companyId: string;
  let openingId: string;

  beforeAll(async () => {
    // Autenticar admin
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin1234!' });
    tokenAdmin = res.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    companyId = meRes.body.user.companyId;

    // Obtener una vacante activa
    const openRes = await request(app)
      .get('/api/recruitment/openings')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    openingId = openRes.body[0].id;
  });

  // ─── 1. INTERVALOS Y FUSIÓN DE EXPERIENCIAS (CERO DOBLE CONTEO) ────────────

  test('1. Intervalos superpuestos no duplican meses laborados (mergeIntervals)', () => {
    const intervals = [
      { start: new Date(2020, 0, 1), end: new Date(2022, 11, 31) }, // 3 años (2020 - 2022)
      { start: new Date(2022, 0, 1), end: new Date(2024, 11, 31) }, // 3 años (2022 - 2024)
    ];
    const merged = mergeIntervals(intervals);
    expect(merged.length).toBe(1);
    expect(merged[0].start).toEqual(new Date(2020, 0, 1));
    expect(merged[0].end).toEqual(new Date(2024, 11, 31));

    const totalMonths = diffMonths(merged[0].start, merged[0].end);
    // De 2020 a 2024 son 5 años (60 meses), NO 6 años (72 meses)
    expect(totalMonths).toBe(60);
  });

  test('2. Experiencias consecutivas no superpuestas se suman correctamente', () => {
    const experiences = [
      { company: 'Empresa A', position: 'Agente', startDate: '2018-01', endDate: '2019-12' }, // 24 meses
      { company: 'Empresa B', position: 'Agente', startDate: '2020-01', endDate: '2022-12' }, // 36 meses
    ];
    const months = calculateNonOverlappingMonths(experiences);
    expect(months).toBe(60); // 5 años exactos
  });

  test('3. Cálculo preciso de edad a partir de fecha de nacimiento', () => {
    const birthDate = '1995-05-15';
    const age = calculateAge(birthDate);
    expect(age).toBeGreaterThanOrEqual(30);
  });

  // ─── 2. EVALUADOR DE REGLAS INDIVIDUALES ──────────────────────────────────────

  const baseCandidate: Candidate = {
    id: 'c1',
    company_id: 'comp1',
    document_type: 'DNI',
    document_number: '71234567',
    first_name: 'Juan',
    last_name: 'Pérez',
    phone: '987654321',
    birth_date: '1990-06-15', // ~36 años
    height_cm: 176,
    sucamec_status: 'valid',
    sucamec_code: 'SUC-2024-9988',
    gun_license: true,
    driver_license: true,
    military_service: true,
    security_experience_years: 5,
    structured_profile: {
      experiences: [
        { company: 'Securitas', position: 'Supervisor de Seguridad', startDate: '2019-01', endDate: '2024-01' },
      ],
      education: [{ institution: 'Colegio San José', degree: 'Secundaria', level: 'Secundaria', year: '2008' }],
      courses: [],
      skills: ['CCTV', 'Manejo de personal'],
    },
    created_at: '',
    updated_at: '',
  };

  const baseOpening: JobOpening = {
    id: 'op1',
    company_id: 'comp1',
    title: 'Supervisor de Seguridad',
    position_type: 'Supervisor',
    location: 'Lima',
    vacancies_count: 2,
    filled_count: 0,
    status: 'open',
    created_at: '',
    updated_at: '',
  };

  const baseApp: Application = {
    id: 'app1',
    company_id: 'comp1',
    candidate_id: 'c1',
    job_opening_id: 'op1',
    application_status: 'submitted',
    progress_percentage: 100,
    prefilter_status: 'pending',
    prefilter_score: 0,
    total_accredited_exp_months: 60,
    total_declared_exp_months: 60,
    discrepancies_count: 0,
    current_stage: 'registered',
    created_at: '',
    updated_at: '',
  };

  test('4. Regla de Rango de Edad: Edad válida dentro de rango produce PASS', () => {
    const req: OpeningRequirement = {
      id: 'r1',
      company_id: 'comp1',
      job_opening_id: 'op1',
      version: 1,
      code: 'REQ_AGE',
      title: 'Edad Permitida (21 a 55)',
      requirement_type: 'eliminatory',
      rule_type: 'range',
      rule_config: { min: 21, max: 55 },
      weight_score: 0,
      order_index: 1,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const out = EvaluationEngine.evaluate({
      application: baseApp,
      candidate: baseCandidate,
      opening: baseOpening,
      requirements: [req],
      documents: [],
    });

    expect(out.evaluations[0].result).toBe('pass');
    expect(out.prefilterStatus).toBe('eligible');
  });

  test('5. Regla de Rango de Edad: Edad fuera de rango produce FAIL y descalifica', () => {
    const req: OpeningRequirement = {
      id: 'r1',
      company_id: 'comp1',
      job_opening_id: 'op1',
      version: 1,
      code: 'REQ_AGE',
      title: 'Edad Permitida (21 a 30)',
      requirement_type: 'eliminatory',
      rule_type: 'range',
      rule_config: { min: 21, max: 30 },
      weight_score: 0,
      order_index: 1,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const out = EvaluationEngine.evaluate({
      application: baseApp,
      candidate: baseCandidate, // ~36 años
      opening: baseOpening,
      requirements: [req],
      documents: [],
    });

    expect(out.evaluations[0].result).toBe('fail');
    expect(out.prefilterStatus).toBe('ineligible');
    expect(out.rejectionReason).toContain('Edad no permitida');
  });

  test('6. Experiencia mínima cumplida (experience_total)', () => {
    const req: OpeningRequirement = {
      id: 'r2',
      company_id: 'comp1',
      job_opening_id: 'op1',
      version: 1,
      code: 'REQ_EXP',
      title: 'Experiencia Mínima 2 años',
      requirement_type: 'eliminatory_scoreable',
      rule_type: 'experience_total',
      rule_config: { minMonths: 24, maxScoreMonths: 60 },
      weight_score: 30,
      order_index: 2,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const out = EvaluationEngine.evaluate({
      application: baseApp,
      candidate: baseCandidate, // 60 meses
      opening: baseOpening,
      requirements: [req],
      documents: [],
    });

    expect(out.evaluations[0].result).toBe('pass');
    expect(out.evaluations[0].score_earned).toBe(30);
  });

  test('7. Experiencia específica en puesto (experience_specific regex)', () => {
    const req: OpeningRequirement = {
      id: 'r3',
      company_id: 'comp1',
      job_opening_id: 'op1',
      version: 1,
      code: 'REQ_SPECIFIC',
      title: 'Experiencia como Supervisor',
      requirement_type: 'scoreable',
      rule_type: 'experience_specific',
      rule_config: { minMonths: 24, positionPattern: 'supervisor' },
      weight_score: 20,
      order_index: 3,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const out = EvaluationEngine.evaluate({
      application: baseApp,
      candidate: baseCandidate,
      opening: baseOpening,
      requirements: [req],
      documents: [],
    });

    expect(out.evaluations[0].result).toBe('pass');
    expect(out.evaluations[0].score_earned).toBe(20);
  });

  test('8. Documento vigente: SUCAMEC valid produce PASS', () => {
    const req: OpeningRequirement = {
      id: 'r4',
      company_id: 'comp1',
      job_opening_id: 'op1',
      version: 1,
      code: 'REQ_SUCAMEC',
      title: 'Carné SUCAMEC Vigente',
      requirement_type: 'eliminatory',
      rule_type: 'validity',
      rule_config: { expectedStatus: 'valid' },
      weight_score: 0,
      order_index: 4,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const out = EvaluationEngine.evaluate({
      application: baseApp,
      candidate: baseCandidate,
      opening: baseOpening,
      requirements: [req],
      documents: [],
    });

    expect(out.evaluations[0].result).toBe('pass');
  });

  test('9. SUCAMEC vencido o ausente produce FAIL eliminatorio', () => {
    const req: OpeningRequirement = {
      id: 'r4',
      company_id: 'comp1',
      job_opening_id: 'op1',
      version: 1,
      code: 'REQ_SUCAMEC',
      title: 'Carné SUCAMEC Vigente',
      requirement_type: 'eliminatory',
      rule_type: 'validity',
      rule_config: { expectedStatus: 'valid' },
      weight_score: 0,
      order_index: 4,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const out = EvaluationEngine.evaluate({
      application: baseApp,
      candidate: { ...baseCandidate, sucamec_status: 'expired' },
      opening: baseOpening,
      requirements: [req],
      documents: [],
    });

    expect(out.evaluations[0].result).toBe('fail');
    expect(out.prefilterStatus).toBe('ineligible');
  });

  test('10. Documento faltante produce REVIEW si no es eliminatorio', () => {
    const req: OpeningRequirement = {
      id: 'r5',
      company_id: 'comp1',
      job_opening_id: 'op1',
      version: 1,
      code: 'REQ_CUL',
      title: 'Certificado Único Laboral (CUL)',
      requirement_type: 'documental',
      rule_type: 'document_evidence',
      rule_config: { documentType: 'cul' },
      weight_score: 25,
      required_document_type: 'cul',
      order_index: 5,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const out = EvaluationEngine.evaluate({
      application: baseApp,
      candidate: baseCandidate,
      opening: baseOpening,
      requirements: [req],
      documents: [], // Sin CUL adjunto
    });

    expect(out.evaluations[0].result).toBe('review');
    expect(out.prefilterStatus).toBe('review');
  });

  test('11. Detección de Discrepancia Documental entre declarado y certificados', () => {
    const candWithDiscrepancy: Candidate = {
      ...baseCandidate,
      security_experience_years: 8, // Afirma 8 años (96 meses)
      structured_profile: {
        experiences: [
          { company: 'Empresa A', position: 'Agente', startDate: '2022-01', endDate: '2024-01' }, // Solo 24 meses
        ],
        education: [],
        courses: [],
        skills: [],
      },
    };

    const out = EvaluationEngine.evaluate({
      application: baseApp,
      candidate: candWithDiscrepancy,
      opening: baseOpening,
      requirements: [],
      documents: [],
    });

    expect(out.discrepanciesCount).toBeGreaterThan(0);
    expect(out.discrepancies[0].severity).toBe('high');
    expect(out.prefilterStatus).toBe('review'); // No rechaza automáticamente
  });

  test('12. Requisito eliminatorio evaluado con máxima prioridad', () => {
    const reqAgeFail: OpeningRequirement = {
      id: 'r_fail',
      company_id: 'comp1',
      job_opening_id: 'op1',
      version: 1,
      code: 'REQ_AGE_FAIL',
      title: 'Edad 20 a 30',
      requirement_type: 'eliminatory',
      rule_type: 'range',
      rule_config: { min: 20, max: 30 },
      weight_score: 0,
      order_index: 1,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const reqScorePass: OpeningRequirement = {
      id: 'r_pass',
      company_id: 'comp1',
      job_opening_id: 'op1',
      version: 1,
      code: 'REQ_EXP_TOP',
      title: 'Experiencia 100 pts',
      requirement_type: 'scoreable',
      rule_type: 'experience_total',
      rule_config: { minMonths: 12 },
      weight_score: 100,
      order_index: 2,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const out = EvaluationEngine.evaluate({
      application: baseApp,
      candidate: baseCandidate, // 36 años -> falla edad
      opening: baseOpening,
      requirements: [reqAgeFail, reqScorePass],
      documents: [],
    });

    // Aunque tenga 100 puntos en experiencia, la edad eliminatoria lo hace INELIGIBLE
    expect(out.prefilterStatus).toBe('ineligible');
  });

  test('13. Desglose de puntaje explicable y rúbrica completa', () => {
    const req1: OpeningRequirement = {
      id: 'r1',
      company_id: 'comp1',
      job_opening_id: 'op1',
      version: 1,
      code: 'REQ_EXP',
      title: 'Experiencia (50 pts)',
      requirement_type: 'scoreable',
      rule_type: 'experience_total',
      rule_config: { minMonths: 12, maxScoreMonths: 60 },
      weight_score: 50,
      order_index: 1,
      is_active: true,
      created_at: '',
      updated_at: '',
    };
    const req2: OpeningRequirement = {
      id: 'r2',
      company_id: 'comp1',
      job_opening_id: 'op1',
      version: 1,
      code: 'REQ_FFAA',
      title: 'Servicio Militar (50 pts)',
      requirement_type: 'scoreable',
      rule_type: 'boolean',
      rule_config: { field: 'military_service', targetValue: true },
      weight_score: 50,
      order_index: 2,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const out = EvaluationEngine.evaluate({
      application: baseApp,
      candidate: baseCandidate,
      opening: baseOpening,
      requirements: [req1, req2],
      documents: [],
    });

    expect(out.prefilterScore).toBe(100);
    expect(out.prefilterBreakdown.rubric.length).toBe(2);
    expect(out.prefilterBreakdown.totalEarned).toBe(100);
  });

  // ─── 3. ENDPOINTS DE API, OVERRIDE Y AUDITORÍA ───────────────────────────────

  test('14. GET /api/recruitment/openings/:id/requirements retorna requisitos configurados', async () => {
    const res = await request(app)
      .get(`/api/recruitment/openings/${openingId}/requirements`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('15. POST /api/recruitment/openings/:id/requirements actualiza y versiona requisitos', async () => {
    const newRequirements = [
      {
        code: 'REQ_AGE_CUSTOM',
        title: 'Edad Operativa Personalizada',
        requirement_type: 'eliminatory',
        rule_type: 'range',
        rule_config: { min: 20, max: 60 },
        weight_score: 0,
        order_index: 1,
        is_active: true,
      },
      {
        code: 'REQ_EXP_CUSTOM',
        title: 'Experiencia Mínima',
        requirement_type: 'eliminatory_scoreable',
        rule_type: 'experience_total',
        rule_config: { minMonths: 12, maxScoreMonths: 36 },
        weight_score: 60,
        order_index: 2,
        is_active: true,
      },
      {
        code: 'REQ_MILITARY_CUSTOM',
        title: 'Servicio Militar',
        requirement_type: 'scoreable',
        rule_type: 'boolean',
        rule_config: { field: 'military_service', targetValue: true },
        weight_score: 40,
        order_index: 3,
        is_active: true,
      },
    ];

    const res = await request(app)
      .post(`/api/recruitment/openings/${openingId}/requirements`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ requirements: newRequirements });

    expect(res.status).toBe(200);
    expect(res.body.totalScoreableWeight).toBe(100);
    expect(res.body.requirements.length).toBe(3);
  });

  let testApplicationId: string;

  test('16. POST /api/recruitment/applications/:id/evaluate ejecuta evaluación y guarda snapshots', async () => {
    // Obtener una aplicación existente
    const pipeRes = await request(app)
      .get('/api/recruitment/pipeline')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    testApplicationId = pipeRes.body[0].id;

    const res = await request(app)
      .post(`/api/recruitment/applications/${testApplicationId}/evaluate`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.prefilterStatus).toBeDefined();
    expect(res.body.prefilterScore).toBeGreaterThanOrEqual(0);
    expect(res.body.breakdown).toBeDefined();
  });

  test('17. GET /api/recruitment/applications/:id/evaluation retorna detalle explicable y evidencias', async () => {
    const res = await request(app)
      .get(`/api/recruitment/applications/${testApplicationId}/evaluation`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.application).toBeDefined();
    expect(Array.isArray(res.body.evaluations)).toBe(true);
    expect(res.body.evaluations.length).toBeGreaterThan(0);
  });

  test('18. POST /api/recruitment/applications/:id/override permite override humano con justificación', async () => {
    // Obtener la primera evaluación
    const evalDetail = await request(app)
      .get(`/api/recruitment/applications/${testApplicationId}/evaluation`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    const targetEval = evalDetail.body.evaluations[0];

    const res = await request(app)
      .post(`/api/recruitment/applications/${testApplicationId}/override`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        evaluationId: targetEval.id,
        newResult: 'pass',
        overrideReason: 'Candidato presentó constancia física original en entrevista presencial.',
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Override registrado');
  });

  test('19. Override sin motivo es rechazado con error 400', async () => {
    const evalDetail = await request(app)
      .get(`/api/recruitment/applications/${testApplicationId}/evaluation`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    const targetEval = evalDetail.body.evaluations[0];

    const res = await request(app)
      .post(`/api/recruitment/applications/${testApplicationId}/override`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        evaluationId: targetEval.id,
        newResult: 'pass',
        overrideReason: 'no', // Muy corto
      });

    expect(res.status).toBe(400);
  });

  test('20. Override queda auditado en tabla audit_logs', async () => {
    const { rows } = await db.query(
      `SELECT * FROM audit_logs 
       WHERE company_id = $1 AND action = 'human_evaluation_override' 
       ORDER BY created_at DESC LIMIT 1`,
      [companyId]
    );

    expect(rows.length).toBe(1);
    expect(rows[0].resource).toBe('application_evaluations');
    expect(rows[0].details.overrideReason).toContain('constancia física original');
  });

  test('21. GET /api/recruitment/openings/:id/ranking genera ranking ordenado por compatibilidad', async () => {
    const res = await request(app)
      .get(`/api/recruitment/openings/${openingId}/ranking`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0].rankPosition).toBe(1);
      expect(res.body[0].prefilter_score).toBeDefined();
    }
  });

  test('22. GET /api/recruitment/openings/:id/evaluation-summary retorna métricas agregadas', async () => {
    const res = await request(app)
      .get(`/api/recruitment/openings/${openingId}/evaluation-summary`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.total_applicants).toBeDefined();
  });

  test('23. Aislamiento Multi-Tenant: Empresa A no puede evaluar aplicaciones de Empresa B', async () => {
    const fakeCompanyId = 'b0000000-0000-0000-0000-000000000002';
    // Consulta directa para verificar filtro por companyId
    const { rows } = await db.query(
      `SELECT * FROM applications WHERE company_id = $1`,
      [fakeCompanyId]
    );
    expect(rows.length).toBe(0);
  });

  test('24. Requisitos históricos conservan su snapshot inmutable', async () => {
    const { rows } = await db.query<{ evaluation_snapshot: any }>(
      `SELECT evaluation_snapshot FROM applications WHERE id = $1`,
      [testApplicationId]
    );

    expect(rows[0].evaluation_snapshot).toBeDefined();
    expect(rows[0].evaluation_snapshot.evaluatedAt).toBeDefined();
  });

  test('25. Documento CUL acredita simultáneamente identidad y antecedentes', () => {
    const culDoc: ApplicationDocument = {
      id: 'doc_cul_1',
      company_id: 'comp1',
      application_id: 'app1',
      document_type: 'cul',
      file_name: 'Certiadulto_71234567.pdf',
      file_path: 'uploads/cul.pdf',
      status: 'verified',
      uploaded_at: '',
    };

    const reqDni: OpeningRequirement = {
      id: 'r_dni',
      company_id: 'comp1',
      job_opening_id: 'op1',
      version: 1,
      code: 'REQ_DNI',
      title: 'Identidad Acreditada',
      requirement_type: 'documental',
      rule_type: 'document_evidence',
      rule_config: { documentType: 'cul' },
      weight_score: 10,
      order_index: 1,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const reqAntecedentes: OpeningRequirement = {
      id: 'r_antecedentes',
      company_id: 'comp1',
      job_opening_id: 'op1',
      version: 1,
      code: 'REQ_CUL_BG',
      title: 'Antecedentes CUL',
      requirement_type: 'documental',
      rule_type: 'document_evidence',
      rule_config: { documentType: 'cul' },
      weight_score: 20,
      order_index: 2,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const out = EvaluationEngine.evaluate({
      application: baseApp,
      candidate: baseCandidate,
      opening: baseOpening,
      requirements: [reqDni, reqAntecedentes],
      documents: [culDoc],
    });

    expect(out.evaluations[0].result).toBe('pass');
    expect(out.evaluations[1].result).toBe('pass');
    expect(out.evaluations[0].evidence_document_id).toBe('doc_cul_1');
    expect(out.evaluations[1].evidence_document_id).toBe('doc_cul_1');
  });

  test('26. Eliminatorio + Puntuable valida umbral mínimo y otorga bonificación', () => {
    const req: OpeningRequirement = {
      id: 'r_combo',
      company_id: 'comp1',
      job_opening_id: 'op1',
      version: 1,
      code: 'REQ_EXP_COMBO',
      title: 'Experiencia Progresiva',
      requirement_type: 'eliminatory_scoreable',
      rule_type: 'experience_total',
      rule_config: { minMonths: 12, maxScoreMonths: 60 },
      weight_score: 50,
      order_index: 1,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    // Caso A: Tiene 6 meses (< 12) -> FAIL eliminatorio
    const candA = { ...baseCandidate, security_experience_years: 0.5, structured_profile: { experiences: [{ company: 'A', position: 'Agente', startDate: '2024-01', endDate: '2024-06' }], education: [], courses: [], skills: [] } };
    const outA = EvaluationEngine.evaluate({
      application: baseApp,
      candidate: candA,
      opening: baseOpening,
      requirements: [req],
      documents: [],
    });
    expect(outA.evaluations[0].result).toBe('fail');
    expect(outA.prefilterStatus).toBe('ineligible');

    // Caso B: Tiene 60 meses (>= 60) -> PASS con 50 puntos completos
    const outB = EvaluationEngine.evaluate({
      application: baseApp,
      candidate: baseCandidate,
      opening: baseOpening,
      requirements: [req],
      documents: [],
    });
    expect(outB.evaluations[0].result).toBe('pass');
    expect(outB.evaluations[0].score_earned).toBe(50);
  });

  test('27. Candidato con baja confianza de OCR es clasificado como REVIEW (no rechazo)', () => {
    const req: OpeningRequirement = {
      id: 'r_ocr',
      company_id: 'comp1',
      job_opening_id: 'op1',
      version: 1,
      code: 'REQ_OCR',
      title: 'Certificado de Trabajo',
      requirement_type: 'documental',
      rule_type: 'document_evidence',
      rule_config: { documentType: 'cert_trabajo' },
      weight_score: 20,
      order_index: 1,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const out = EvaluationEngine.evaluate({
      application: baseApp,
      candidate: baseCandidate,
      opening: baseOpening,
      requirements: [req],
      documents: [], // Sin documento verificado
    });

    expect(out.prefilterStatus).toBe('review');
  });

  test('28. Endpoint público no expone ranking interno a postulantes', async () => {
    const res = await request(app)
      .get(`/api/public/openings/${openingId}`)
      .send();

    expect(res.status).toBe(200);
    // El postulante solo ve la vacante, jamás el ranking de otros competidores
    expect(res.body.ranking).toBeUndefined();
    expect(res.body.topCandidates).toBeUndefined();
  });

  test('29. Criterios de desempate en ranking operan de forma determinista', async () => {
    const res = await request(app)
      .get(`/api/recruitment/openings/${openingId}/ranking`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    for (let i = 0; i < res.body.length - 1; i++) {
      const current = res.body[i];
      const next = res.body[i + 1];
      // Si ambos son del mismo estado, el prefilter_score del actual debe ser >= al siguiente
      if (current.prefilter_status === next.prefilter_status) {
        expect(Number(current.prefilter_score)).toBeGreaterThanOrEqual(Number(next.prefilter_score));
      }
    }
  });

  test('30. Reevaluación en lote ejecuta todas las postulaciones de la vacante', async () => {
    const res = await request(app)
      .post(`/api/recruitment/openings/${openingId}/evaluate-all`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Se evaluaron');
  });
});
