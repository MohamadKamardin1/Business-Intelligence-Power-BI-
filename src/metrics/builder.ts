import type { FilterContext } from './context';

export function buildWhereClause(context?: FilterContext): string {
  if (!context) return '1=1';

  const conditions: string[] = ['1=1'];

  if (context.branch_id) conditions.push(`c.branch_id = '${context.branch_id.replace(/'/g, "''")}'`);
  if (context.job) conditions.push(`c.job = '${context.job.replace(/'/g, "''")}'`);
  if (context.education) conditions.push(`c.education = '${context.education.replace(/'/g, "''")}'`);
  if (context.marital) conditions.push(`c.marital = '${context.marital.replace(/'/g, "''")}'`);
  
  if (context.has_housing_loan !== undefined) {
    conditions.push(`c.housing_loan = ${context.has_housing_loan ? 1 : 0}`);
  }
  if (context.has_personal_loan !== undefined) {
    conditions.push(`c.personal_loan = ${context.has_personal_loan ? 1 : 0}`);
  }
  if (context.ageRange) {
    conditions.push(`c.age >= ${context.ageRange[0]} AND c.age <= ${context.ageRange[1]}`);
  }
  if (context.campaign) {
    conditions.push(`cc.campaign = ${context.campaign}`);
  }
  if (context.dateRange) {
    conditions.push(`cc.contact_date >= '${context.dateRange[0]}' AND cc.contact_date <= '${context.dateRange[1]}'`);
  }

  return conditions.join(' AND ');
}

export function memoizeMetric<T extends (db: any, ctx?: FilterContext) => any>(fn: T): T {
  const cache = new Map<string, any>();
  return ((db: any, ctx?: FilterContext) => {
    const key = ctx ? JSON.stringify(ctx, Object.keys(ctx).sort()) : 'NO_FILTER';
    if (cache.has(key)) return cache.get(key);
    
    const result = fn(db, ctx);
    cache.set(key, result);
    return result;
  }) as T;
}
