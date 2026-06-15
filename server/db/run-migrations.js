import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

async function runMigrations() {
  const isProduction = process.env.NODE_ENV === 'production';

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
  });

  try {
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get all migration files
    const migrationFiles = fs.readdirSync(path.join(__dirname, 'migrations'))
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Run each migration in order
    for (const file of migrationFiles) {
      // Check if migration has already been run
      const result = await pool.query(
        'SELECT * FROM schema_migrations WHERE migration_name = $1',
        [file]
      );

      if (result.rows.length > 0) {
        console.log(`Skipping already run migration: ${file}`);
        continue;
      }

      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(__dirname, 'migrations', file), 'utf8');
      await pool.query(sql);
      
      // Record that this migration has been run
      await pool.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
        [file]
      );
      
      console.log(`Completed migration: ${file}`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigrations().catch(console.error);
