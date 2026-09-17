import request from 'supertest';
import express from 'express';
import cors from 'cors';
import publicRoutes from '../modules/recruitment/api/routes/public.routes';
import recruitmentRoutes from '../modules/recruitment/api/routes/recruitment.routes';
import authRoutes from '../modules/numbering-cards/api/routes/auth.routes';
import db from '../db';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/public', publicRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/auth', authRoutes);

describe('PORTAL PÚBLICO DE POSTULACIÓN — Security Force P&V S.A.C.', () => {
  let sampleOpeningId: string;
  let draftToken: string;
  let appCode: string;
  const testDni = `88${Math.floor(100000 + Math.random() * 900000)}`;

  beforeAll(async () => {
    // Buscar o crear una empresa y vacante abierta en la base de datos
    let compRes = await db.query(`SELECT id FROM companies WHERE is_active = TRUE LIMIT 1`);
    let compId = compRes.rows[0]?.id;
    if (!compId) {
      const newComp = await db.query(
        `INSERT INTO companies (name, ruc, is_active) VALUES ('Security Force SAC', '20123456789', TRUE) RETURNING id`
      );
      compId = newComp.rows[0].id;
    }

    const { rows } = await db.query(`SELECT id FROM job_openings WHERE status = 'open' LIMIT 1`);
    if (rows.length > 0) {
      sampleOpeningId = rows[0].id;
    } else {
      const newOp = await db.query(
        `INSERT INTO job_openings (company_id, title, position_type, location, vacancies_count, status)
         VALUES ($1, 'Agente de Seguridad L1', 'Agente de Seguridad', 'Lima Centro', 5, 'open')
         RETURNING id`,
        [compId]
      );
      sampleOpeningId = newOp.rows[0].id;
    }
  });

  afterAll(async () => {
    // Limpieza de datos de prueba
    if (testDni) {
      await db.query(`DELETE FROM candidates WHERE document_number = $1`, [testDni]);
    }
  });

  // 1. Acceso público a vacantes
  test('1. GET /api/public/openings devuelve lista pública de vacantes abiertas', async () => {
    const res = await request(app).get('/api/public/openings');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('title');
    expect(res.body[0]).toHaveProperty('location');
    expect(res.body[0]).toHaveProperty('requirements');
  });

  // 2. Detalle de vacante
  test('2. GET /api/public/openings/:id devuelve requisitos y documentos solicitados', async () => {
    const res = await request(app).get(`/api/public/openings/${sampleOpeningId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(sampleOpeningId);
    expect(res.body.requirements).toBeInstanceOf(Array);
    expect(res.body.requirements.length).toBeGreaterThan(0);
  });

  // 3. Inicio de postulación sin login (DNI + Celular)
  test('3. POST /api/public/apply/init genera draft_token y código oficial SF-2026-XXXXX', async () => {
    const res = await request(app)
      .post('/api/public/apply/init')
      .send({
        openingId: sampleOpeningId,
        documentType: 'DNI',
        documentNumber: testDni,
        firstName: 'Prueba',
        lastName: 'Automatizada',
        phone: '999888777',
        birthDate: '1995-05-12',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('draftToken');
    expect(res.body).toHaveProperty('applicationCode');
    expect(res.body.applicationCode).toMatch(/^SF-2026-[A-Z0-9]{5}$/);

    draftToken = res.body.draftToken;
    appCode = res.body.applicationCode;
  });

  // 4. Recuperación del borrador
  test('4. GET /api/public/apply/:draftToken recupera el borrador en progreso', async () => {
    const res = await request(app).get(`/api/public/apply/${draftToken}`);
    expect(res.status).toBe(200);
    expect(res.body.application).toBeDefined();
    expect(res.body.application.application_code).toBe(appCode);
    expect(res.body.application.candidate_document_number).toBe(testDni);
  });

  // 5. Guardado de perfil estructurado (Experiencia, Educación, SUCAMEC)
  test('5. PUT /api/public/apply/:draftToken/profile guarda el perfil y experiencia laboral', async () => {
    const res = await request(app)
      .put(`/api/public/apply/${draftToken}/profile`)
      .send({
        district: 'San Juan de Lurigancho',
        heightCm: 176,
        weightKg: 78,
        sucamecStatus: 'valid',
        sucamecCode: 'SUC-2026-TEST',
        gunLicense: true,
        securityExperienceYears: 3,
        structuredProfile: {
          experiences: [
            {
              company: 'Seguridad Test S.A.',
              position: 'Agente de Seguridad',
              startDate: '2022-01',
              endDate: '2024-01',
              city: 'Lima',
              functions: 'Control de accesos y vigilancia',
            },
          ],
          education: [
            {
              institution: 'Colegio Nacional San Juan',
              degree: 'Secundaria Completa',
              level: 'Secundaria',
              year: '2015',
              status: 'Culminado',
            },
          ],
          courses: [],
          skills: ['Tiro defensivo', 'Control de accesos'],
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Perfil guardado');
  });

  // 6. Envío final de postulación
  test('6. POST /api/public/apply/:draftToken/submit envía la postulación y calcula compatibilidad', async () => {
    const res = await request(app).post(`/api/public/apply/${draftToken}/submit`);
    expect(res.status).toBe(200);
    expect(res.body.applicationCode).toBe(appCode);
    // El motor real calcula el score basado en los requisitos configurados de la convocatoria
    expect(res.body.compatibilityScore).toBeGreaterThanOrEqual(0);
    expect(res.body.compatibilityScore).toBeLessThanOrEqual(100);
  });

  // 7. Consulta de seguimiento pública con DNI + Código
  test('7. POST /api/public/tracking permite consultar estado con DNI y Código Oficial', async () => {
    const res = await request(app)
      .post('/api/public/tracking')
      .send({
        documentNumber: testDni,
        applicationCode: appCode,
      });

    expect(res.status).toBe(200);
    expect(res.body.applicationCode).toBe(appCode);
    expect(res.body.documentNumber).toBe(testDni);
    expect(res.body.status).toBe('submitted');
    expect(res.body.currentStage).toBe('registered');
  });

  // 8. Seguridad: Intento de consulta con código incorrecto falla
  test('8. POST /api/public/tracking con código incorrecto devuelve 404', async () => {
    const res = await request(app)
      .post('/api/public/tracking')
      .send({
        documentNumber: testDni,
        applicationCode: 'SF-2026-INVALID',
      });

    expect(res.status).toBe(404);
  });

  // 9. Backoffice protegido: Rutas internas siguen requiriendo autenticación
  test('9. GET /api/recruitment/summary sin token devuelve 401 Unauthorized', async () => {
    const res = await request(app).get('/api/recruitment/summary');
    expect(res.status).toBe(401);
  });
});
