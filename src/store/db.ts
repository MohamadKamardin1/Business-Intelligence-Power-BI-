import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';

import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

let dbInstance: Database | null = null;

export async function getAnalyticsDB(): Promise<Database> {
  if (dbInstance) return dbInstance;
  
  console.log('[DB Init] Starting SQL.js initialization...');
  console.time('Init SQL.js');
  const SQL = await initSqlJs({
    locateFile: () => wasmUrl
  });
  console.timeEnd('Init SQL.js');
  
  console.log('[DB Init] Fetching /data/analytics.sqlite...');
  console.time('Fetch SQLite DB');
  const response = await fetch('/data/analytics.sqlite');
  if (!response.ok) {
    throw new Error('Failed to fetch analytics database');
  }
  const buffer = await response.arrayBuffer();
  console.timeEnd('Fetch SQLite DB');
  
  console.log(`[DB Init] Database fetched, size: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
  console.log('[DB Init] Instantiating SQL.Database from buffer (This may take a moment)...');
  console.time('Instantiate SQL DB');
  dbInstance = new SQL.Database(new Uint8Array(buffer));
  console.timeEnd('Instantiate SQL DB');
  
  console.log('[DB Init] Creating database indexes to optimize joins...');
  console.time('Create Indexes');
  try {
    dbInstance.exec(`
      CREATE INDEX IF NOT EXISTS idx_customers_id ON customers(id);
      CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(branch_id);
      CREATE INDEX IF NOT EXISTS idx_campaign_client ON campaign_contacts(client_id);
      CREATE INDEX IF NOT EXISTS idx_branches_branch ON branches(branch_id);
    `);
    console.timeEnd('Create Indexes');
  } catch (err) {
    console.error('[DB Init] Error creating indexes:', err);
  }
  
  console.log('[DB Init] Database initialization complete.');
  return dbInstance;
}

export async function executeQuery(query: string): Promise<any | null> {
  const db = await getAnalyticsDB();
  const results = db.exec(query);
  return results.length > 0 ? results[0] : null;
}

export async function getQueryExecutor() {
  const db = await getAnalyticsDB();
  return {
    query: (sql: string) => {
      const qId = `Query_${Math.random().toString(36).substr(2, 5)}`;
      console.time(qId);
      
      const res = db.exec(sql);
      
      console.timeEnd(qId);
      
      if (res.length === 0) return [];
      
      const columns = res[0].columns;
      const values = res[0].values;
      
      return values.map(row => {
        const obj: any = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    }
  };
}
