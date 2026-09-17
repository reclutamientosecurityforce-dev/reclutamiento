import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
declare const pool: Pool;
export interface DatabaseClient {
    query<T extends QueryResultRow = QueryResultRow>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
    release(): void;
}
declare class Database {
    private pool;
    constructor(pgPool: Pool);
    /**
     * Ejecuta una consulta SQL directamente en el pool.
     * Usa esta función para consultas simples de lectura/escritura.
     */
    query<T extends QueryResultRow = QueryResultRow>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
    /**
     * Obtiene un cliente dedicado del pool para transacciones.
     * SIEMPRE hacer client.release() en el bloque finally.
     */
    getClient(): Promise<PoolClient>;
    /**
     * Ejecuta una función dentro de una transacción.
     * BEGIN / COMMIT / ROLLBACK se manejan automáticamente.
     */
    transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
    /**
     * Verifica que la conexión a PostgreSQL esté activa.
     */
    healthCheck(): Promise<{
        ok: boolean;
        message: string;
    }>;
    /**
     * Cierra todas las conexiones del pool.
     */
    close(): Promise<void>;
}
export declare const db: Database;
export { pool };
export default db;
//# sourceMappingURL=index.d.ts.map