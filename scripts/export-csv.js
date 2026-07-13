import Database from 'better-sqlite3';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'public', 'data', 'analytics.sqlite');
const outputDir = path.join(__dirname, '..', 'export');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const db = new Database(dbPath);

const tables = [
  'customers',
  'campaign_contacts',
  'dates',
  'branches'
];

tables.forEach(table => {
  const rows = db.prepare(`SELECT * FROM ${table}`).all();
  if (rows.length > 0) {
    const csvData = stringify(rows, { header: true });
    fs.writeFileSync(path.join(outputDir, `${table}.csv`), csvData);
    console.log(`Exported ${table}.csv (${rows.length} rows)`);
  }
});

db.close();
console.log('Export complete! Files are saved in the /export folder.');
