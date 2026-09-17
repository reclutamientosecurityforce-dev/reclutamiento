import request from 'supertest';
import { app } from '../server';
import db from '../db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('CMS INSTITUCIONAL DEL PORTAL PÚBLICO (FASE 2.8)', () => {
  let tokenAdminA: string;
  let tokenAdminB: string;
  let companyIdA: string;
  let companyIdB: string;
  let userIdA: string;
  let userIdB: string;

  const sessionIdA = '11111111-1111-1111-1111-111111111111';
  const sessionIdB = '22222222-2222-2222-2222-222222222222';

  beforeAll(async () => {
    // 1. Obtener o crear Empresa A
    const compARes = await db.query(
      `INSERT INTO companies (name, ruc, is_active)
       VALUES ('Security Force P&V A', '20999888111', TRUE)
       ON CONFLICT (ruc) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    companyIdA = compARes.rows[0].id;

    // 2. Obtener o crear Empresa B para pruebas multi-tenant
    const compBRes = await db.query(
      `INSERT INTO companies (name, ruc, is_active)
       VALUES ('Security Force P&V B', '20999888222', TRUE)
       ON CONFLICT (ruc) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    companyIdB = compBRes.rows[0].id;

    // 3. Crear usuario admin para Empresa A
    const userARes = await db.query(
      `INSERT INTO users (company_id, username, email, password_hash, full_name, role, is_active)
       VALUES ($1, 'admin_cms_a', 'admin_a@securityforce.pe', '$2b$10$wE9l1E43wJ6u80/W83W1fOvhv2E0L9L5/5Y4.hQ9P89k5E4rP9H8O', 'Admin A', 'admin', TRUE)
       ON CONFLICT (company_id, username) DO UPDATE SET is_active = TRUE
       RETURNING id`,
      [companyIdA]
    );
    userIdA = userARes.rows[0].id;

    // 4. Crear usuario admin para Empresa B
    const userBRes = await db.query(
      `INSERT INTO users (company_id, username, email, password_hash, full_name, role, is_active)
       VALUES ($1, 'admin_cms_b', 'admin_b@securityforce.pe', '$2b$10$wE9l1E43wJ6u80/W83W1fOvhv2E0L9L5/5Y4.hQ9P89k5E4rP9H8O', 'Admin B', 'admin', TRUE)
       ON CONFLICT (company_id, username) DO UPDATE SET is_active = TRUE
       RETURNING id`,
      [companyIdB]
    );
    userIdB = userBRes.rows[0].id;

    // 5. Crear tokens y sesiones en PostgreSQL para autenticación válida
    const jwtSecret = process.env.JWT_SECRET || 'secret-jwt-key-for-signed-urls';

    tokenAdminA = jwt.sign(
      { userId: userIdA, companyId: companyIdA, role: 'admin', sessionId: sessionIdA },
      jwtSecret
    );
    const hashA = crypto.createHash('sha256').update(tokenAdminA).digest('hex');
    await db.query(
      `INSERT INTO sessions (id, company_id, user_id, token_hash, is_active, expires_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW() + INTERVAL '8 hours')
       ON CONFLICT (id) DO UPDATE SET token_hash = EXCLUDED.token_hash, is_active = TRUE`,
      [sessionIdA, companyIdA, userIdA, hashA]
    );

    tokenAdminB = jwt.sign(
      { userId: userIdB, companyId: companyIdB, role: 'admin', sessionId: sessionIdB },
      jwtSecret
    );
    const hashB = crypto.createHash('sha256').update(tokenAdminB).digest('hex');
    await db.query(
      `INSERT INTO sessions (id, company_id, user_id, token_hash, is_active, expires_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW() + INTERVAL '8 hours')
       ON CONFLICT (id) DO UPDATE SET token_hash = EXCLUDED.token_hash, is_active = TRUE`,
      [sessionIdB, companyIdB, userIdB, hashB]
    );
  });

  afterAll(async () => {
    // Limpieza de datos de prueba
    await db.query(`DELETE FROM sessions WHERE id IN ($1, $2)`, [sessionIdA, sessionIdB]);
    await db.query(`DELETE FROM portal_sections WHERE company_id IN ($1, $2)`, [companyIdA, companyIdB]);
    await db.query(`DELETE FROM portal_section_history WHERE company_id IN ($1, $2)`, [companyIdA, companyIdB]);
    await db.query(`DELETE FROM portal_media WHERE company_id IN ($1, $2)`, [companyIdA, companyIdB]);
  });

  test('1. Permisos: Ruta admin rechaza petición sin token', async () => {
    const res = await request(app).get('/api/admin/portal/sections');
    expect(res.status).toBe(401);
  });

  test('2. Fallback: Consulta pública de sección sin publicar devuelve fallback seguro', async () => {
    const res = await request(app).get('/api/public/content/hero');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body.title).toBeTruthy();
  });

  test('3. Guardar borrador (Draft) de Hero para Empresa A', async () => {
    const res = await request(app)
      .put('/api/admin/portal/sections/hero')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({
        title: 'VIGILANCIA DE ÉLITE',
        subtitle: 'SEGURIDAD TOTAL 2026',
        description: 'Texto de prueba en borrador que no debe verse públicamente todavía.',
        content_data: {
          eyebrow: 'CONVOCATORIA NACIONAL',
          primary_cta_text: 'POSTULA YA',
          primary_cta_url: '#convocatorias',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.draft.status).toBe('draft');
    expect(res.body.draft.title).toBe('VIGILANCIA DE ÉLITE');
  });

  test('4. El borrador NO se expone en la API pública', async () => {
    const res = await request(app).get('/api/public/content/hero');
    expect(res.status).toBe(200);
    // No debe devolver el título del borrador
    expect(res.body.title).not.toBe('VIGILANCIA DE ÉLITE');
  });

  test('5. Publicar sección Hero incrementa versión y actualiza portal público', async () => {
    const pubRes = await request(app)
      .post('/api/admin/portal/sections/hero/publish')
      .set('Authorization', `Bearer ${tokenAdminA}`);

    expect(pubRes.status).toBe(200);
    expect(pubRes.body.published.status).toBe('published');
    expect(pubRes.body.published.version).toBeGreaterThanOrEqual(1);

    // Ahora la API pública sí debe devolver el contenido publicado
    const publicRes = await request(app).get('/api/public/content/hero');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.title).toBe('VIGILANCIA DE ÉLITE');
    expect(publicRes.body.subtitle).toBe('SEGURIDAD TOTAL 2026');
  });

  test('6. Guardar y publicar sección "about" con estadísticas dinámicas', async () => {
    await request(app)
      .put('/api/admin/portal/sections/about')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({
        title: 'NUESTRA TRAYECTORIA',
        description: 'Más de 15 años liderando la seguridad privada.',
        content_data: {
          mission: 'Proteger con honor y tecnología.',
          vision: 'Ser el referente número 1 en resguardo.',
          stats: [
            { value: '+15', label: 'Años en el mercado', order: 1, is_active: true },
            { value: '+6000', label: 'Agentes desplegados', order: 2, is_active: true },
          ],
        },
      });

    const pubRes = await request(app)
      .post('/api/admin/portal/sections/about/publish')
      .set('Authorization', `Bearer ${tokenAdminA}`);

    expect(pubRes.status).toBe(200);

    const publicRes = await request(app).get('/api/public/content/about');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.title).toBe('NUESTRA TRAYECTORIA');
    expect(publicRes.body.content_data.stats[0].value).toBe('+15');
  });

  test('7. Guardar y publicar sección "benefits" con items administrables', async () => {
    await request(app)
      .put('/api/admin/portal/sections/benefits')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({
        title: 'BENEFICIOS EXCLUSIVOS',
        content_data: {
          items: [
            { id: 'b1', title: 'Seguro Médico Premium', description: 'Cobertura 100%', is_active: true },
            { id: 'b2', title: 'Bono Trimestral', description: 'Por desempeño excelente', is_active: true },
          ],
        },
      });

    await request(app)
      .post('/api/admin/portal/sections/benefits/publish')
      .set('Authorization', `Bearer ${tokenAdminA}`);

    const publicRes = await request(app).get('/api/public/content/benefits');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.title).toBe('BENEFICIOS EXCLUSIVOS');
    expect(publicRes.body.content_data.items.length).toBe(2);
  });

  test('8. Versionado e Historial: Se crea registro histórico tras segunda publicación', async () => {
    // Editar y publicar de nuevo Hero
    await request(app)
      .put('/api/admin/portal/sections/hero')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({
        title: 'VIGILANCIA AVANZADA v2',
        subtitle: 'PROTECCIÓN TOTAL v2',
      });

    await request(app)
      .post('/api/admin/portal/sections/hero/publish')
      .set('Authorization', `Bearer ${tokenAdminA}`);

    // Consultar historial
    const histRes = await request(app)
      .get('/api/admin/portal/sections/hero/history')
      .set('Authorization', `Bearer ${tokenAdminA}`);

    expect(histRes.status).toBe(200);
    expect(histRes.body.length).toBeGreaterThanOrEqual(1);
    expect(histRes.body[0]).toHaveProperty('version');
  });

  test('9. Restauración: Restaurar versión anterior la carga como borrador activo', async () => {
    const histRes = await request(app)
      .get('/api/admin/portal/sections/hero/history')
      .set('Authorization', `Bearer ${tokenAdminA}`);

    const previousVersion = histRes.body[0].version;

    const restoreRes = await request(app)
      .post(`/api/admin/portal/sections/hero/restore/${previousVersion}`)
      .set('Authorization', `Bearer ${tokenAdminA}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.draft.status).toBe('draft');
  });

  test('10. Aislamiento Multi-Tenant: Empresa B no puede leer borradores ni historial de Empresa A', async () => {
    const histResB = await request(app)
      .get('/api/admin/portal/sections/hero/history')
      .set('Authorization', `Bearer ${tokenAdminB}`);

    expect(histResB.status).toBe(200);
    // El historial de Empresa B debe estar vacío para esta sección
    expect(histResB.body.length).toBe(0);

    const sectionB = await request(app)
      .get('/api/admin/portal/sections/hero')
      .set('Authorization', `Bearer ${tokenAdminB}`);

    expect(sectionB.status).toBe(200);
    expect(sectionB.body.status).toBe('fallback');
  });

  test('11. Auditoría: Se registran entradas en audit_logs tras operaciones de CMS', async () => {
    const auditRes = await db.query(
      `SELECT * FROM audit_logs
       WHERE company_id = $1 AND resource = 'cms_portal'
       ORDER BY created_at DESC`,
      [companyIdA]
    );

    expect(auditRes.rows.length).toBeGreaterThan(0);
    const actions = auditRes.rows.map((r: any) => r.action);
    expect(actions).toContain('cms_published');
    expect(actions).toContain('cms_draft_saved');
  });

  test('12. Subida de Multimedia Pública: Permite subir imagen a portal_media', async () => {
    const fakeBuffer = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;');

    const mediaRes = await request(app)
      .post('/api/admin/portal/media')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .attach('media', fakeBuffer, { filename: 'test_banner.gif', contentType: 'image/gif' })
      .field('altText', 'Banner de Prueba')
      .field('sectionKey', 'hero');

    expect(mediaRes.status).toBe(201);
    expect(mediaRes.body.media).toHaveProperty('public_url');
    expect(mediaRes.body.media.mime_type).toBe('image/gif');

    // Listar galería
    const listRes = await request(app)
      .get('/api/admin/portal/media')
      .set('Authorization', `Bearer ${tokenAdminA}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBeGreaterThan(0);
  });
});
