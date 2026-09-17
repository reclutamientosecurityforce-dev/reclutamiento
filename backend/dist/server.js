"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.startServer = startServer;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// ─── VERIFICACIÓN DE VARIABLES OBLIGATORIAS ────────────────────────────────────
// La verificación de DATABASE_URL ocurre al importar db/index.ts
const db_1 = __importDefault(require("./db"));
// ─── RUTAS DEL MÓDULO ─────────────────────────────────────────────────────────
const auth_routes_1 = __importDefault(require("./modules/numbering-cards/api/routes/auth.routes"));
const cards_routes_1 = __importDefault(require("./modules/numbering-cards/api/routes/cards.routes"));
const admin_routes_1 = __importDefault(require("./modules/numbering-cards/api/routes/admin.routes"));
const recruitment_routes_1 = __importDefault(require("./modules/recruitment/api/routes/recruitment.routes"));
const public_routes_1 = __importDefault(require("./modules/recruitment/api/routes/public.routes"));
// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const app = (0, express_1.default)();
exports.app = app;
// ─── SEGURIDAD ────────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
}));
// Rate limiting global
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500,
    message: { error: 'Demasiadas solicitudes. Intente más tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
}));
// Rate limiting específico para login
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Demasiados intentos de login. Intente en 15 minutos.' },
});
// ─── PARSER JSON ──────────────────────────────────────────────────────────────
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
    const dbHealth = await db_1.default.healthCheck();
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
app.use('/api/auth', loginLimiter, auth_routes_1.default);
app.use('/api/cards', cards_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/recruitment', recruitment_routes_1.default);
app.use('/api/public', public_routes_1.default);
// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada.' });
});
// ─── ERROR HANDLER GLOBAL ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
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
async function startServer() {
    // Verificar conexión a PostgreSQL
    const health = await db_1.default.healthCheck();
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
        console.log('\n⚠️  Recuerda ejecutar ANTES del primer inicio:\n' +
            '   npm run db:migrate\n' +
            '   npm run db:seed\n');
    });
}
// Manejo de señales para cierre ordenado
process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM recibido. Cerrando servidor...');
    await db_1.default.close();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('\n🛑 SIGINT recibido. Cerrando servidor...');
    await db_1.default.close();
    process.exit(0);
});
if (process.env.NODE_ENV !== 'test') {
    startServer().catch((err) => {
        console.error('Error al iniciar el servidor:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=server.js.map