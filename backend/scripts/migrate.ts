#!/usr/bin/env ts-node
/**
 * Script independiente de migración.
 * Uso: npm run db:migrate
 *
 * Este script NO forma parte del arranque del servidor.
 * Debe ejecutarse ANTES de iniciar el servidor.
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error(
    '\n❌ ERROR: DATABASE_URL es obligatoria para ejecutar migraciones.\n' +
    'Configura el archivo .env antes de continuar.\n'
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  console.log('🔌 Conectado a PostgreSQL.');

  try {
    // Crear tabla de control de migraciones si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id         SERIAL PRIMARY KEY,
        filename   VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Ejecutar schema principal
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📋 Aplicando schema principal...');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      await client.query(schema);
      console.log('✅ Schema aplicado correctamente.');
    } else {
      throw new Error(`Schema no encontrado en: ${schemaPath}`);
    }

    // Ejecutar migraciones adicionales en orden
    const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      for (const file of files) {
        const { rows } = await client.query(
          'SELECT id FROM _migrations WHERE filename = $1',
          [file]
        );
        if (rows.length > 0) {
          console.log(`⏭  Migración ya aplicada: ${file}`);
          continue;
        }

        console.log(`📄 Aplicando migración: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO _migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ Migración aplicada: ${file}`);
      }
    }

    console.log('\n✅ Todas las migraciones completadas exitosamente.\n');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n❌ Error durante la migración:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
