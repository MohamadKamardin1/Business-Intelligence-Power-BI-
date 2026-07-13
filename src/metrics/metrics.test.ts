import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import type { QueryExecutor } from './context';
import { 
  getSubscriptionConversionRate, 
  getAverageAccountBalance,
  getHousingLoanUptakeRate,
  getRegionalPerformanceRanking
} from './index';

let dbWrapper: QueryExecutor;

beforeAll(() => {
  const dbPath = path.resolve(process.cwd(), 'public/data/analytics.sqlite');
  const db = new Database(dbPath, { readonly: true });
  
  dbWrapper = {
    query: (sql: string) => db.prepare(sql).all()
  };
});

describe('Metrics SQL Engine', () => {
  it('should calculate overall subscription conversion rate', () => {
    const rate = getSubscriptionConversionRate(dbWrapper);
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThan(1); // Usually around 11% for this dataset
  });

  it('should filter subscription rate by job context', () => {
    const adminRate = getSubscriptionConversionRate(dbWrapper, { job: 'admin.' });
    const blueCollarRate = getSubscriptionConversionRate(dbWrapper, { job: 'blue-collar' });
    
    // They should return valid numbers and generally differ
    expect(adminRate).toBeGreaterThan(0);
    expect(blueCollarRate).toBeGreaterThan(0);
    expect(adminRate).not.toBe(blueCollarRate);
  });

  it('should calculate average balance properly avoiding duplicates', () => {
    const avgBalance = getAverageAccountBalance(dbWrapper);
    expect(avgBalance).toBeGreaterThan(100);
  });

  it('should calculate housing loan uptake rate', () => {
    const uptake = getHousingLoanUptakeRate(dbWrapper);
    expect(uptake).toBeGreaterThan(0);
    expect(uptake).toBeLessThan(1);
  });

  it('should generate a regional performance ranking', () => {
    const ranking = getRegionalPerformanceRanking(dbWrapper);
    expect(ranking.length).toBeGreaterThan(0);
    expect(ranking[0].name).toBeDefined();
    expect(ranking[0].conversion_rate).toBeDefined();
    
    // Test ordering
    if (ranking.length > 1) {
      expect(ranking[0].conversion_rate).toBeGreaterThanOrEqual(ranking[1].conversion_rate);
    }
  });
});
