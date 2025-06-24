import fs from 'fs';
import path from 'path';
import { query } from './index';

const runMigrations = async () => {
  try {
    // Read migration files
    const migrationsPath = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsPath).sort();

    // Execute each migration
    for (const file of files) {
      if (file.endsWith('.sql')) {
        const migration = fs.readFileSync(path.join(migrationsPath, file), 'utf-8');
        console.log(`Running migration: ${file}`);
        await query(migration);
        console.log(`Completed migration: ${file}`);
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
