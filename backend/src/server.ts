import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// ─── VERIFICACIÓN DE VARIABLES OBLIGATORIAS ────────────────────────────────────
// La verificación de DATABASE_URL ocurre al importar db/index.ts
import db from './db';

// ─── RUTAS DEL MÓDULO ─────────────────────────────────────────────────────────
import authRoutes from './modules/numbering-cards/api/routes/auth.routes';
import cardsRoutes from './modules/numbering-cards/api/routes/cards.routes';
import adminRoutes from './modules/numbering-cards/api/routes/admin.routes';
import recruitmentRoutes from './modules/recruitment/api/routes/recruitment.routes';
import publicRoutes from './modules/recruitment/api/routes/public.routes';

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const app = express();

// ─── SEGURIDAD ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

// Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500,
  message: { error: 'Demasiadas solicitudes. Intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Rate limiting específico para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos de login. Intente en 15 minutos.' },
});

// ─── PARSER JSON ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const dbHealth = await db.healthCheck();
  res.status(dbHealth.ok ? 200 : 503).json({
    status: dbHealth.ok ? 'ok' : 'error',
    database: dbHealth.message,
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── RUTAS API ────────────────────────────────────────────────────────────────
// NOTA: Las migraciones NO se ejecutan aquí.
// Usar: npm run db:migrate && npm run db:seed ANTES de iniciar el servidor.
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/public', publicRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// ─── ERROR HANDLER GLOBAL ─────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no manejado:', err);
  
  // Handle Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 10MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Campo de archivo no esperado.' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({
    error: NODE_ENV === 'production' ? 'Error interno del servidor.' : err.message,
  });
});

// ─── INICIO DEL SERVIDOR ──────────────────────────────────────────────────────
async function startServer(): Promise<void> {
  // Verificar conexión a PostgreSQL
  const health = await db.healthCheck();
  if (!health.ok) {
    console.error(`\n❌ No se puede conectar a PostgreSQL:\n   ${health.message}\n`);
    console.error('   Verifica DATABASE_URL en tu archivo .env\n');
    process.exit(1);
  }

  console.log(`\n✅ ${health.message}`);

  app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
    console.log(`📊 Ambiente: ${NODE_ENV}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(
      '\n⚠️  Recuerda ejecutar ANTES del primer inicio:\n' +
      '   npm run db:migrate\n' +
      '   npm run db:seed\n'
    );
  });
}

// Manejo de señales para cierre ordenado
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM recibido. Cerrando servidor...');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT recibido. Cerrando servidor...');
  await db.close();
  process.exit(0);
});

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('Error al iniciar el servidor:', err);
    process.exit(1);
  });
}

export { app, startServer };
