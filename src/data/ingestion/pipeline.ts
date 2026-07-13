import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import Database from 'better-sqlite3';
import {
  parseUnknown, parseBoolean, validateAge, cleanPdays,
  assignSyntheticBranch, getBranches, getMonthNumber, getQuarter
} from './cleaning';

const RAW_CSV_PATH = path.resolve(process.cwd(), 'raw-data/bank-full.csv');
const PUBLIC_DIR = path.resolve(process.cwd(), 'public/data');
const DB_OUTPUT_PATH = path.join(PUBLIC_DIR, 'analytics.sqlite');
const CLEANED_CSV_PATH = path.join(PUBLIC_DIR, 'cleaned-dataset.csv');
const REPORT_PATH = path.join(PUBLIC_DIR, 'data-quality-report.json');

if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
if (fs.existsSync(DB_OUTPUT_PATH)) fs.unlinkSync(DB_OUTPUT_PATH);

const db = new Database(DB_OUTPUT_PATH);

db.exec(`
  CREATE TABLE branches (
    branch_id TEXT PRIMARY KEY,
    name TEXT,
    region TEXT,
    lat REAL,
    lng REAL,
    is_synthetic BOOLEAN
  );

  CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    age INTEGER,
    job TEXT,
    marital TEXT,
    education TEXT,
    default_status BOOLEAN,
    balance INTEGER,
    housing_loan BOOLEAN,
    personal_loan BOOLEAN,
    branch_id TEXT,
    FOREIGN KEY(branch_id) REFERENCES branches(branch_id)
  );

  CREATE TABLE dates (
    date TEXT PRIMARY KEY,
    day INTEGER,
    month INTEGER,
    quarter INTEGER,
    year INTEGER
  );

  CREATE TABLE campaign_contacts (
    client_id TEXT,
    contact_date TEXT,
    duration INTEGER,
    campaign INTEGER,
    pdays INTEGER,
    previous INTEGER,
    poutcome TEXT,
    subscribed BOOLEAN,
    FOREIGN KEY(client_id) REFERENCES customers(id),
    FOREIGN KEY(contact_date) REFERENCES dates(date)
  );
`);

const insertBranch = db.prepare('INSERT INTO branches (branch_id, name, region, lat, lng, is_synthetic) VALUES (?, ?, ?, ?, ?, ?)');
const insertCustomer = db.prepare('INSERT INTO customers (id, age, job, marital, education, default_status, balance, housing_loan, personal_loan, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertDate = db.prepare('INSERT OR IGNORE INTO dates (date, day, month, quarter, year) VALUES (?, ?, ?, ?, ?)');
const insertContact = db.prepare('INSERT INTO campaign_contacts (client_id, contact_date, duration, campaign, pdays, previous, poutcome, subscribed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

for (const branch of getBranches()) {
  insertBranch.run(branch.branch_id, branch.name, branch.region, branch.lat, branch.lng, branch.is_synthetic ? 1 : 0);
}

const metrics = {
  rowsProcessed: 0,
  rowsWritten: 0,
  nullsHandled: 0,
  outliersFlagged: 0
};

console.log('Reading CSV...');
const csvContent = fs.readFileSync(RAW_CSV_PATH, 'utf-8');
const records = parse(csvContent, { delimiter: ';', columns: true });

console.log(`Processing ${records.length} records...`);

const csvLines: string[] = [
  'client_id,age,job,marital,education,default,balance,housing,loan,contact_date,duration,campaign,pdays,previous,poutcome,subscribed,branch_id'
];

let clientCounter = 1;

const insertAll = db.transaction(() => {
  for (const row of records as any[]) {
    metrics.rowsProcessed++;
    
    const clientId = `CUST_${String(clientCounter).padStart(6, '0')}`;
    clientCounter++;

    const age = validateAge(row.age);
    if (age === -1) metrics.outliersFlagged++;
    
    const job = parseUnknown(row.job);
    const marital = parseUnknown(row.marital);
    const education = parseUnknown(row.education);
    if (!job || !marital || !education) metrics.nullsHandled++;

    const defaultStatus = parseBoolean(row.default);
    const balance = parseInt(row.balance, 10);
    const housing = parseBoolean(row.housing);
    const loan = parseBoolean(row.loan);
    
    const branch = assignSyntheticBranch(clientId);
    
    insertCustomer.run(clientId, age, job, marital, education, defaultStatus ? 1 : 0, balance, housing ? 1 : 0, loan ? 1 : 0, branch.branch_id);

    const day = parseInt(row.day, 10);
    const month = getMonthNumber(row.month);
    const quarter = getQuarter(month);
    const year = 2010;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    insertDate.run(dateStr, day, month, quarter, year);

    const duration = parseInt(row.duration, 10);
    const campaign = parseInt(row.campaign, 10);
    const pdays = cleanPdays(row.pdays);
    const previous = parseInt(row.previous, 10);
    const poutcome = parseUnknown(row.poutcome);
    const subscribed = parseBoolean(row.y);

    insertContact.run(clientId, dateStr, duration, campaign, pdays, previous, poutcome, subscribed ? 1 : 0);
    
    csvLines.push(
      [
        clientId, age, job || '', marital || '', education || '', defaultStatus, balance,
        housing, loan, dateStr, duration, campaign, pdays === null ? '' : pdays, previous,
        poutcome || '', subscribed, branch.branch_id
      ].join(',')
    );

    metrics.rowsWritten++;
  }
});

insertAll();
console.log('Database populated successfully.');
db.close();

fs.writeFileSync(CLEANED_CSV_PATH, csvLines.join('\\n'));
console.log('Exported cleaned CSV to', CLEANED_CSV_PATH);

fs.writeFileSync(REPORT_PATH, JSON.stringify(metrics, null, 2));
console.log('Data Quality Report:', metrics);
