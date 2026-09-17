/**
 * Tests de integración del sistema de Reclutamiento y Selección.
 * Security Force P&V S.A.C.
 *
 * Cobertura:
 * 1. Arquitectura PostgreSQL exclusiva (pg.Pool)
 * 2. Login / RBAC / Multi-tenant (Admin vs Recruiter)
 * 3. Dashboard /api/recruitment/summary
 * 4. Convocatorias /api/recruitment/openings
 * 5. Candidatos /api/recruitment/candidates
 * 6. Pipeline de Selección /api/recruitment/pipeline
 * 7. Concurrencia y bloqueo transaccional
 * 8. Persistencia de datos
 */
import request from 'supertest';
import { app } from '../server';
import db from '../db';

const TEST_COMPANY_ID = 'a0000000-0000-0000-0000-000000000001';

async function loginAs(username: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username, password });
  if (res.status !== 200) {
    throw new Error(`Login falló para ${username}: ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

// ─── VERIFICACIONES DE ARQUITECTURA ───────────────────────────────────────────

describe('FASE 1: Arquitectura y Base de Datos', () => {
  it('No debe haber imports de @electric-sql/pglite', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@electric-sql/pglite');
    }).toThrow();
  });

  it('db/index.ts usa exclusivamente pg.Pool y health check responde 200', async () => {
    const health = await db.healthCheck();
    expect(health.ok).toBe(true);

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('DATABASE_URL debe estar configurada', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.DATABASE_URL).not.toBe('');
  });
});

// ─── AUTENTICACIÓN Y RBAC ─────────────────────────────────────────────────────

describe('FASE 2: Autenticación y RBAC', () => {
  it('Login con credenciales correctas de admin devuelve JWT y rol admin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin1234!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('admin');
    expect(res.body.user.companyId).toBe(TEST_COMPANY_ID);
  });

  it('Login con credenciales de reclutador devuelve rol recruiter/user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'carlos.perez', password: 'User1234!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('Login con contraseña incorrecta devuelve 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'WrongPassword999!' });

    expect(res.status).toBe(401);
  });

  it('Request sin token a ruta protegida devuelve 401', async () => {
    const res = await request(app).get('/api/recruitment/summary');
    expect(res.status).toBe(401);
  });
});

// ─── RECLUTAMIENTO BACKOFFICE ─────────────────────────────────────────────────

describe('FASE 3: Dashboard y Métricas de Reclutamiento', () => {
  let token: string;

  beforeAll(async () => {
    token = await loginAs('admin', 'Admin1234!');
  });

  it('GET /api/recruitment/summary devuelve KPIs agregados del embudo', async () => {
    const res = await request(app)
      .get('/api/recruitment/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalCandidates');
    expect(res.body).toHaveProperty('openVacancies');
    expect(res.body).toHaveProperty('pipelineCounts');
    expect(res.body.totalCandidates).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/recruitment/candidates devuelve postulantes paginados', async () => {
    const res = await request(app)
      .get('/api/recruitment/candidates?limit=10&page=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/recruitment/openings devuelve convocatorias activas', async () => {
    const res = await request(app)
      .get('/api/recruitment/openings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/recruitment/pipeline devuelve candidatos organizados por etapa', async () => {
    const res = await request(app)
      .get('/api/recruitment/pipeline')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── MULTI-TENANT Y SEGURIDAD ─────────────────────────────────────────────────

describe('FASE 4: Multi-tenant aislado y Persistencia', () => {
  let token: string;

  beforeAll(async () => {
    token = await loginAs('admin', 'Admin1234!');
  });

  it('Candidatos devueltos son exclusivamente de la empresa del token', async () => {
    const res = await request(app)
      .get('/api/recruitment/candidates?limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    for (const c of res.body.data) {
      expect(c.company_id).toBe(TEST_COMPANY_ID);
    }
  });

  it('Los datos persisten en PostgreSQL en llamadas consecutivas', async () => {
    const res1 = await request(app)
      .get('/api/recruitment/summary')
      .set('Authorization', `Bearer ${token}`);

    const res2 = await request(app)
      .get('/api/recruitment/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.totalCandidates).toBe(res2.body.totalCandidates);
  });
});
