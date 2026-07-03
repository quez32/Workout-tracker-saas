// ============================================
// Database Migration Runner
// ============================================
// Run this script to apply the schema to your Turso database.
// Usage: bun run src/db/migrate.ts
// ============================================

import { getDb } from './index';
import { schemaSql } from './schema';

async function migrate() {
  console.log('🚀 Running database migrations...');

  try {
    const db = getDb();

    // Split by statements (semicolons followed by newlines) and execute each
    const statements = schemaSql
      .split(';\n')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      if (stmt.length > 0) {
        const sql = stmt.endsWith(';') ? stmt : stmt + ';';
        console.log(`📝 Executing: ${sql.substring(0, 80)}...`);
        await db.execute(sql);
      }
    }

    console.log('✅ Migrations applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
