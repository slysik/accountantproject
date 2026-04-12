#!/usr/bin/env bun
/**
 * Run a SQL migration file against Supabase via session pooler.
 * Usage: bun scripts/run-migration.ts <path-to-sql-file>
 */
import pg from 'pg';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: bun scripts/run-migration.ts <path-to-sql-file>');
  process.exit(1);
}

const pw = process.env.SUPABASE_DB_PASSWORD;
if (!pw) {
  console.error('Missing SUPABASE_DB_PASSWORD in .env.local');
  process.exit(1);
}

const sql = await Bun.file(filePath).text();
console.log(`\n=== Running migration: ${filePath} ===`);
console.log(`SQL length: ${sql.length} chars\n`);

const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.enkmkdhloycjczdqaucg',
  password: pw,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log('Connected to database.');

  const result = await client.query(sql);

  console.log('\nMigration completed successfully.');
  if (Array.isArray(result)) {
    const nonEmpty = result.filter(r => r.rowCount && r.rowCount > 0);
    for (const r of nonEmpty) {
      console.log(`  ${r.command}: ${r.rowCount} row(s)`);
    }
  } else if (result.rowCount && result.rowCount > 0) {
    console.log(`  ${result.command}: ${result.rowCount} row(s)`);
  }
} catch (err) {
  console.error('\nMigration FAILED:');
  console.error((err as Error).message);
  process.exit(1);
} finally {
  await client.end();
}
