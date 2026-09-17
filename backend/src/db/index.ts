import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ─── DATABASE_URL ES OBLIGATORIA ───────────────────────────────────────────────
// El servidor NO inicia si DATABASE_URL no está configurada.
// NO se realiza ningún fallback a bases de datos locales.
if (!process.env.DATABASE_URL) {
  console.error(
    '\n❌ ERROR CRÍTICO: DATABASE_URL es obligatoria.\n' +
    'Configure la conexión PostgreSQL antes de iniciar el servidor.\n' +
    'Ejemplo: DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/db\n'
  );
  process.exit(1);
}

const sslEnabled = process.env.DB_SSL === 'true';

// ─── POOL DE CONEXIONES POSTGRESQL ────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message);
});

// ─── INTERFACE DE BASE DE DATOS ────────────────────────────────────────────────
export interface DatabaseClient {
  query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult<T>>;
  release(): void;
}

// ─── CLASE PRINCIPAL ───────────────────────────────────────────────────────────
class Database {
  private pool: Pool;

  constructor(pgPool: Pool) {
    this.pool = pgPool;
  }

  /**
   * Ejecuta una consulta SQL directamente en el pool.
   * Usa esta función para consultas simples de lectura/escritura.
   */
  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(sql, params);
  }

  /**
   * Obtiene un cliente dedicado del pool para transacciones.
   * SIEMPRE hacer client.release() en el bloque finally.
   */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * Ejecuta una función dentro de una transacción.
   * BEGIN / COMMIT / ROLLBACK se manejan automáticamente.
   */
  async transaction<T>(
    fn: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Verifica que la conexión a PostgreSQL esté activa.
   */
  async healthCheck(): Promise<{ ok: boolean; message: string }> {
    try {
      const result = await this.pool.query<{ now: string }>(
        'SELECT NOW() AS now'
      );
      return {
        ok: true,
        message: `PostgreSQL conectado. Hora del servidor: ${result.rows[0].now}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      return { ok: false, message };
    }
  }

  /**
   * Cierra todas las conexiones del pool.
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// ─── EXPORTACIÓN SINGLETON ─────────────────────────────────────────────────────
export const db = new Database(pool);
export { pool };
export default db;
