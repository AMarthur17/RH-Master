import db from '../src/db.js';
import fs from 'fs';
import path from 'path';

async function run() {
  try {
    const sqlPath = path.join(process.cwd(), 'backend', 'tools', 'create_sensitive_events.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error('SQL file not found:', sqlPath);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    await db.query(sql);
    console.log('Tabela sensitive_events criada/populada com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao popular sensitive_events:', err);
    process.exit(1);
  }
}

run();
