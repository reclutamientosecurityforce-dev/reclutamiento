"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.db = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// ─── DATABASE_URL ES OBLIGATORIA ───────────────────────────────────────────────
// El servidor NO inicia si DATABASE_URL no está configurada.
// NO se realiza ningún fallback a bases de datos locales.
if (!process.env.DATABASE_URL) {
    console.error('\n❌ ERROR CRÍTICO: DATABASE_URL es obligatoria.\n' +
        'Configure la conexión PostgreSQL antes de iniciar el servidor.\n' +
        'Ejemplo: DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/db\n');
    process.exit(1);
}
const sslEnabled = process.env.DB_SSL === 'true';
// ─── POOL DE CONEXIONES POSTGRESQL ────────────────────────────────────────────
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
exports.pool = pool;
pool.on('error', (err) => {
    console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message);
});
// ─── CLASE PRINCIPAL ───────────────────────────────────────────────────────────
class Database {
    constructor(pgPool) {
        this.pool = pgPool;
    }
    /**
     * Ejecuta una consulta SQL directamente en el pool.
     * Usa esta función para consultas simples de lectura/escritura.
     */
    async query(sql, params) {
        return this.pool.query(sql, params);
    }
    /**
     * Obtiene un cliente dedicado del pool para transacciones.
     * SIEMPRE hacer client.release() en el bloque finally.
     */
    async getClient() {
        return this.pool.connect();
    }
    /**
     * Ejecuta una función dentro de una transacción.
     * BEGIN / COMMIT / ROLLBACK se manejan automáticamente.
     */
    async transaction(fn) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await fn(client);
            await client.query('COMMIT');
            return result;
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    /**
     * Verifica que la conexión a PostgreSQL esté activa.
     */
    async healthCheck() {
        try {
            const result = await this.pool.query('SELECT NOW() AS now');
            return {
                ok: true,
                message: `PostgreSQL conectado. Hora del servidor: ${result.rows[0].now}`,
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            return { ok: false, message };
        }
    }
    /**
     * Cierra todas las conexiones del pool.
     */
    async close() {
        await this.pool.end();
    }
}
// ─── EXPORTACIÓN SINGLETON ─────────────────────────────────────────────────────
exports.db = new Database(pool);
exports.default = exports.db;
//# sourceMappingURL=index.js.map