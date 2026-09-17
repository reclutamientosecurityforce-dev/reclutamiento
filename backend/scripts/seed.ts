#!/usr/bin/env ts-node
/**
 * Script independiente de seed.
 * Uso: npm run db:seed
 *
 * Inserta datos iniciales de desarrollo.
 * NOTA: Requiere que las migraciones ya hayan sido aplicadas.
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error(
    '\n❌ ERROR: DATABASE_URL es obligatoria para ejecutar seeds.\n'
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runSeeds(): Promise<void> {
  const client = await pool.connect();
  console.log('🔌 Conectado a PostgreSQL.');

  try {
    const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Seed no encontrado en: ${seedPath}`);
    }

    console.log('🌱 Aplicando datos de seed...');
    const seed = fs.readFileSync(seedPath, 'utf-8');
    await client.query('BEGIN');
    await client.query(seed);
    await client.query('COMMIT');
    console.log('✅ Seed aplicado correctamente.\n');
    console.log('👤 Usuarios de desarrollo creados:');
    console.log('   admin / Admin1234! (rol: admin)');
    console.log('   carlos.perez / User1234! (rol: user)');
    console.log('   maria.garcia / User1234! (rol: user)\n');
    console.log('⚠️  CAMBIAR CONTRASEÑAS ANTES DE PRODUCCIÓN\n');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n❌ Error durante el seed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeeds();
