#!/usr/bin/env ts-node
/**
 * Script de reset — SOLO DESARROLLO.
 * Uso: npm run db:reset
 *
 * ⚠️ ADVERTENCIA: Elimina TODOS los datos y recrea el schema.
 * NUNCA ejecutar en producción.
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.NODE_ENV === 'production') {
  console.error('❌ db:reset está PROHIBIDO en producción.');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL es obligatoria.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function reset(): Promise<void> {
  const client = await pool.connect();
  console.log('⚠️  RESET DE BASE DE DATOS — SOLO DESARROLLO');
  console.log('🗑️  Eliminando tablas...');

  try {
    await client.query('BEGIN');
    await client.query(`
      DROP TABLE IF EXISTS application_evaluations CASCADE;
      DROP TABLE IF EXISTS opening_requirements CASCADE;
      DROP TABLE IF EXISTS application_documents CASCADE;
      DROP TABLE IF EXISTS stage_evaluations CASCADE;
      DROP TABLE IF EXISTS interviews CASCADE;
      DROP TABLE IF EXISTS applications CASCADE;
      DROP TABLE IF EXISTS candidates CASCADE;
      DROP TABLE IF EXISTS job_openings CASCADE;
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS card_history CASCADE;
      DROP TABLE IF EXISTS cards CASCADE;
      DROP TABLE IF EXISTS numbering_ranges CASCADE;
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS companies CASCADE;
      DROP TABLE IF EXISTS _migrations CASCADE;
      DROP TYPE IF EXISTS opening_status CASCADE;
      DROP TYPE IF EXISTS candidate_status CASCADE;
      DROP TYPE IF EXISTS sucamec_status CASCADE;
      DROP TYPE IF EXISTS stage_result CASCADE;
      DROP TYPE IF EXISTS card_status CASCADE;
      DROP TYPE IF EXISTS user_role CASCADE;
      DROP TYPE IF EXISTS audit_action CASCADE;
    `);
    await client.query('COMMIT');
    console.log('✅ Reset completado. Ejecuta npm run db:migrate && npm run db:seed\n');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Error durante el reset:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

reset();
