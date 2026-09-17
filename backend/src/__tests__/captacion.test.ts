import request from 'supertest';
import { app } from '../server';
import db from '../db';

async function loginAs(username: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username, password });
  if (res.status !== 200) {
    throw new Error(`Login falló para ${username}: ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

describe('Centro de Captación & Trazabilidad Multicanal', () => {
  let adminToken: string;
  let testCategoryId: string;
  let testOpeningId: string;
  let testPubId: string;
  let testSlug: string;

  beforeAll(async () => {
    adminToken = await loginAs('admin', 'Admin1234!');
  });

  it('1. Debe listar las categorías y permitir crear una nueva categoría con plantilla de requisitos', async () => {
    const res = await request(app)
      .post('/api/recruitment/captacion/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Escoltas VIP Test',
        slug: 'escoltas-vip-test',
        icon: 'Shield',
        colorHex: '#dc2626',
        description: 'Custodia personal y resguardo armado',
        templateRequirements: [
          {
            code: 'REQ_GUN_VIP',
            title: 'Licencia L1/L2 Vigente',
            requirement_type: 'eliminatory',
            rule_type: 'boolean',
            rule_config: { field: 'gun_license', targetValue: true },
            weight_score: 0,
            order_index: 1,
          },
        ],
        isActive: true,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Escoltas VIP Test');
    testCategoryId = res.body.id;
  });

  it('2. Debe crear una convocatoria asociada a la categoría y generar sus requisitos desde la plantilla', async () => {
    const res = await request(app)
      .post('/api/recruitment/openings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId: testCategoryId,
        createFromCategoryTemplate: true,
        title: 'Escoltas para Embajada',
        positionType: 'Resguardo Personal',
        location: 'San Isidro',
        vacanciesCount: 3,
        salaryOffered: 2800,
        shiftType: '12x12',
        status: 'open',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    testOpeningId = res.body.id;

    // Verificar que los requisitos de la plantilla fueron insertados
    const reqsRes = await db.query(
      `SELECT * FROM opening_requirements WHERE job_opening_id = $1`,
      [testOpeningId]
    );
    expect(reqsRes.rows.length).toBeGreaterThanOrEqual(1);
    expect(reqsRes.rows[0].code).toBe('REQ_GUN_VIP');
  });

  it('3. Debe crear una publicación vinculada a la convocatoria con slug único en estado borrador', async () => {
    const res = await request(app)
      .post('/api/recruitment/captacion/publications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        jobOpeningId: testOpeningId,
        title: '¡Únete al equipo VIP de Escoltas Armados!',
        description: 'Buscamos resguardos con experiencia para sede diplomática.',
        benefits: ['Sueldo competitivo S/ 2800', 'Seguro de alto riesgo', 'Planilla completa'],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('slug');
    expect(res.body.status).toBe('draft');
    testPubId = res.body.id;
    testSlug = res.body.slug;
  });

  it('4. No debe exponer públicamente una publicación en estado borrador', async () => {
    const res = await request(app).get(`/api/public/p/${testSlug}`);
    expect(res.status).toBe(404);
  });

  it('5. Debe transicionar a published y exponerse públicamente', async () => {
    const statusRes = await request(app)
      .post(`/api/recruitment/captacion/publications/${testPubId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'published' });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.status).toBe('published');

    // Ahora sí es visible al público
    const pubRes = await request(app).get(`/api/public/p/${testSlug}`);
    expect(pubRes.status).toBe(200);
    expect(pubRes.body.publication.publication_title).toBe('¡Únete al equipo VIP de Escoltas Armados!');
    expect(pubRes.body.requirements.length).toBeGreaterThanOrEqual(1);
  });

  it('6. Debe registrar visualizaciones y tracking de píxel sin errores', async () => {
    const viewRes = await request(app)
      .post(`/api/public/p/${testSlug}/view`)
      .send({
        utmSource: 'facebook_test',
        utmMedium: 'cpc',
        utmCampaign: 'escoltas_2026',
      });

    expect(viewRes.status).toBe(200);
    expect(viewRes.body.ok).toBe(true);

    const checkView = await db.query(
      `SELECT * FROM publication_views WHERE publication_id = $1`,
      [testPubId]
    );
    expect(checkView.rows.length).toBe(1);
    expect(checkView.rows[0].utm_source).toBe('facebook_test');
  });

  it('7. Debe iniciar postulación pública por slug y crear snapshot inmutable con la versión de requisitos', async () => {
    const applyRes = await request(app)
      .post('/api/public/apply/init')
      .send({
        publicationSlug: testSlug,
        documentType: 'DNI',
        documentNumber: '79998877',
        firstName: 'Juan',
        lastName: 'Escolta Test',
        phone: '999888777',
        email: 'juan.escolta@test.com',
        utmSource: 'facebook_test',
      });

    expect(applyRes.status).toBe(200);
    expect(applyRes.body).toHaveProperty('draftToken');
    expect(applyRes.body.publication.slug).toBe(testSlug);

    // Verificar snapshot histórico inmutable
    const snapRes = await db.query(
      `SELECT * FROM application_publication_snapshots WHERE publication_id = $1`,
      [testPubId]
    );
    expect(snapRes.rows.length).toBe(1);
    expect(snapRes.rows[0].publication_title).toBe('¡Únete al equipo VIP de Escoltas Armados!');
    expect(snapRes.rows[0].utm_source).toBe('facebook_test');
  });

  it('8. Debe duplicar la publicación generando nuevo slug y dejando métricas en 0', async () => {
    const dupRes = await request(app)
      .post(`/api/recruitment/captacion/publications/${testPubId}/duplicate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(dupRes.status).toBe(201);
    expect(dupRes.body.id).not.toBe(testPubId);
    expect(dupRes.body.slug).not.toBe(testSlug);
    expect(dupRes.body.views_total).toBe(0);
    expect(dupRes.body.applications_completed).toBe(0);
    expect(dupRes.body.status).toBe('draft');
  });

  it('9. Debe obtener el resumen consolidado del Centro de Captación', async () => {
    const summaryRes = await request(app)
      .get('/api/recruitment/captacion/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body).toHaveProperty('active_publications');
    expect(summaryRes.body).toHaveProperty('global_quality_rate_pct');
  });
});
