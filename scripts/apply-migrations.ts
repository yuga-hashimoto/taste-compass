import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// 接続設定
// 環境変数 SUPABASE_DB_PASSWORD を設定してから実行してください
// 例: SUPABASE_DB_PASSWORD='xxx' npx tsx scripts/apply-migrations.ts
const config = {
  host: 'db.fqliatvezpdrfgtymwcc.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || '',
  ssl: { rejectUnauthorized: false },
};

// 適用するSQLファイルの順序
const SQL_FILES = [
  'schema.sql',
  'views.sql',
  'functions.sql',
  'policies.sql',
  'seed.sql',
];

async function main() {
  if (!config.password) {
    console.error('Error: SUPABASE_DB_PASSWORD environment variable is not set.');
    console.error('Usage: SUPABASE_DB_PASSWORD="your-password" npx tsx scripts/apply-migrations.ts');
    process.exit(1);
  }

  const client = new Client(config);
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');

    for (const file of SQL_FILES) {
      const filePath = path.resolve(process.cwd(), 'supabase', file);
      if (!fs.existsSync(filePath)) {
        console.warn(`Skipping ${file} (not found)`);
        continue;
      }
      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log(`\nApplying ${file}...`);
      try {
        await client.query(sql);
        console.log(`✅ ${file} applied successfully`);
      } catch (err: any) {
        console.error(`❌ ${file} failed:`, err.message);
      }
    }
  } catch (err: any) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nConnection closed.');
  }
}

main();
