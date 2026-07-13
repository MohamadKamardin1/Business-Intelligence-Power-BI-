import type { FilterContext, QueryExecutor } from './context';
import { buildWhereClause, memoizeMetric } from './builder';

const BASE_JOIN = `
  FROM customers c
  LEFT JOIN campaign_contacts cc ON c.id = cc.client_id
  LEFT JOIN branches b ON c.branch_id = b.branch_id
`;

// 1. Subscription conversion rate (overall and by segment)
export const getSubscriptionConversionRate = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): number => {
  const where = buildWhereClause(ctx);
  const sql = `SELECT CAST(SUM(cc.subscribed) AS FLOAT) / COUNT(*) as rate ${BASE_JOIN} WHERE ${where}`;
  const res = db.query(sql);
  return res[0]?.rate || 0;
});

// 2. Average account balance (overall, by job, by education)
export const getAverageAccountBalance = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): number => {
  const where = buildWhereClause(ctx);
  // Uses subquery to avoid inflating balance when joined with multiple contacts
  const sql = `SELECT AVG(c.balance) as avg_balance FROM customers c WHERE c.id IN (SELECT c.id ${BASE_JOIN} WHERE ${where})`;
  const res = db.query(sql);
  return res[0]?.avg_balance || 0;
});

// 3. Housing loan uptake rate
export const getHousingLoanUptakeRate = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): number => {
  const where = buildWhereClause(ctx);
  const sql = `SELECT CAST(SUM(c.housing_loan) AS FLOAT) / COUNT(DISTINCT c.id) as rate ${BASE_JOIN} WHERE ${where}`;
  const res = db.query(sql);
  return res[0]?.rate || 0;
});

// 4. Personal loan uptake rate
export const getPersonalLoanUptakeRate = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): number => {
  const where = buildWhereClause(ctx);
  const sql = `SELECT CAST(SUM(c.personal_loan) AS FLOAT) / COUNT(DISTINCT c.id) as rate ${BASE_JOIN} WHERE ${where}`;
  const res = db.query(sql);
  return res[0]?.rate || 0;
});

// 5. Cross-sell rate (clients with both housing + personal loans)
export const getCrossSellRate = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): number => {
  const where = buildWhereClause(ctx);
  const sql = `SELECT CAST(SUM(CASE WHEN c.housing_loan = 1 AND c.personal_loan = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(DISTINCT c.id) as rate ${BASE_JOIN} WHERE ${where}`;
  const res = db.query(sql);
  return res[0]?.rate || 0;
});

// 6. Average call duration by outcome
export const getAverageCallDurationByOutcome = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { outcome: string, avg_duration: number }[] => {
  const where = buildWhereClause(ctx);
  const sql = `SELECT cc.subscribed, AVG(cc.duration) as avg_duration ${BASE_JOIN} WHERE ${where} GROUP BY cc.subscribed`;
  const res = db.query(sql);
  return res.map(r => ({
    outcome: r.subscribed ? 'Subscribed' : 'Not Subscribed',
    avg_duration: r.avg_duration
  }));
});

// 7. Campaign contact efficiency (subscriptions per average number of contacts)
export const getCampaignContactEfficiency = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): number => {
  const where = buildWhereClause(ctx);
  const sql = `SELECT CAST(SUM(cc.subscribed) AS FLOAT) / SUM(cc.campaign) as efficiency ${BASE_JOIN} WHERE ${where}`;
  const res = db.query(sql);
  return res[0]?.efficiency || 0;
});

// 8. Previous-campaign influence on current subscription (poutcome correlation)
export const getPreviousCampaignInfluence = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { poutcome: string, conversion_rate: number }[] => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT cc.poutcome, CAST(SUM(cc.subscribed) AS FLOAT) / COUNT(*) as conversion_rate 
    ${BASE_JOIN} 
    WHERE ${where} AND cc.poutcome IS NOT NULL
    GROUP BY cc.poutcome
  `;
  const res = db.query(sql);
  return res.map(r => ({
    poutcome: r.poutcome,
    conversion_rate: r.conversion_rate
  }));
});

// 9. Balance distribution by age bracket
export const getBalanceDistributionByAge = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { age_bracket: string, avg_balance: number }[] => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT 
      CASE 
        WHEN c.age < 30 THEN '<30'
        WHEN c.age >= 30 AND c.age < 45 THEN '30-44'
        WHEN c.age >= 45 AND c.age < 60 THEN '45-59'
        ELSE '60+' 
      END as age_bracket,
      AVG(c.balance) as avg_balance
    ${BASE_JOIN} WHERE ${where}
    GROUP BY age_bracket
    ORDER BY age_bracket
  `;
  const res = db.query(sql);
  return res.map(r => ({
    age_bracket: r.age_bracket,
    avg_balance: r.avg_balance
  }));
});

// 10. Regional (synthetic branch) performance ranking by subscription rate
export const getRegionalPerformanceRanking = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { branch_id: string, name: string, region: string, conversion_rate: number }[] => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT b.branch_id, b.name, b.region, CAST(SUM(cc.subscribed) AS FLOAT) / COUNT(*) as conversion_rate
    ${BASE_JOIN} WHERE ${where}
    GROUP BY b.branch_id, b.name, b.region
    ORDER BY conversion_rate DESC
  `;
  const res = db.query(sql);
  return res.map(r => ({
    branch_id: r.branch_id,
    name: r.name,
    region: r.region,
    conversion_rate: r.conversion_rate
  }));
});

// 11. Month-over-month subscription trend
export const getMonthOverMonthTrend = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { month: string, subscriptions: number }[] => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT strftime('%Y-%m', cc.contact_date) as month, SUM(cc.subscribed) as subscriptions
    ${BASE_JOIN} WHERE ${where}
    GROUP BY month
    ORDER BY month
  `;
  const res = db.query(sql);
  return res.map(r => ({
    month: r.month,
    subscriptions: r.subscriptions
  }));
});

// Additional metrics for Overview Dashboard
export const getTotalClients = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): number => {
  const where = buildWhereClause(ctx);
  const sql = `SELECT COUNT(DISTINCT c.id) as count ${BASE_JOIN} WHERE ${where}`;
  const res = db.query(sql);
  return res[0]?.count || 0;
});

export const getSubscriptionRateByJob = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { job: string, conversion_rate: number }[] => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT c.job, CAST(SUM(cc.subscribed) AS FLOAT) / COUNT(*) as conversion_rate
    ${BASE_JOIN} WHERE ${where} AND c.job IS NOT NULL
    GROUP BY c.job
    ORDER BY conversion_rate DESC
  `;
  const res = db.query(sql);
  return res.map(r => ({
    job: r.job,
    conversion_rate: r.conversion_rate
  }));
});

export const getSubscriptionRateByEducation = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { education: string, conversion_rate: number }[] => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT c.education, CAST(SUM(cc.subscribed) AS FLOAT) / COUNT(*) as conversion_rate
    ${BASE_JOIN} WHERE ${where} AND c.education IS NOT NULL
    GROUP BY c.education
    ORDER BY conversion_rate DESC
  `;
  const res = db.query(sql);
  return res.map(r => ({
    education: r.education,
    conversion_rate: r.conversion_rate
  }));
});

export const getSubscriptionSplit = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { status: string, count: number }[] => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT cc.subscribed, COUNT(*) as count
    ${BASE_JOIN} WHERE ${where}
    GROUP BY cc.subscribed
  `;
  const res = db.query(sql);
  return res.map(r => ({
    status: r.subscribed ? 'Subscribed' : 'Not Subscribed',
    count: r.count
  }));
});

// Demographic and customer segment metrics for Customers page
export const getAverageAge = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): number => {
  const where = buildWhereClause(ctx);
  const sql = `SELECT AVG(c.age) as avg_age FROM customers c WHERE c.id IN (SELECT c.id ${BASE_JOIN} WHERE ${where})`;
  const res = db.query(sql);
  return res[0]?.avg_age || 0;
});

export const getDefaultRate = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): number => {
  const where = buildWhereClause(ctx);
  const sql = `SELECT CAST(SUM(c.default_status) AS FLOAT) / COUNT(DISTINCT c.id) as rate FROM customers c WHERE c.id IN (SELECT c.id ${BASE_JOIN} WHERE ${where})`;
  const res = db.query(sql);
  return res[0]?.rate || 0;
});

export const getMarriedRate = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): number => {
  const where = buildWhereClause(ctx);
  const sql = `SELECT CAST(SUM(CASE WHEN c.marital = 'married' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(DISTINCT c.id) as rate FROM customers c WHERE c.id IN (SELECT c.id ${BASE_JOIN} WHERE ${where})`;
  const res = db.query(sql);
  return res[0]?.rate || 0;
});

export const getCustomerSegments = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { job: string, education: string, client_count: number, avg_balance: number, conversion_rate: number }[] => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT 
      c.job, 
      c.education, 
      COUNT(DISTINCT c.id) as client_count,
      AVG(c.balance) as avg_balance,
      CAST(SUM(cc.subscribed) AS FLOAT) / COUNT(*) as conversion_rate
    ${BASE_JOIN}
    WHERE ${where} AND c.job IS NOT NULL AND c.education IS NOT NULL
    GROUP BY c.job, c.education
    ORDER BY conversion_rate DESC
  `;
  const res = db.query(sql);
  return res.map(r => ({
    job: r.job,
    education: r.education,
    client_count: r.client_count,
    avg_balance: Math.round(r.avg_balance || 0),
    conversion_rate: r.conversion_rate
  }));
});

export const getTopCustomers = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { id: string, age: number, job: string, balance: number, subscribed: boolean }[] => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT c.id, c.age, c.job, c.balance, cc.subscribed
    ${BASE_JOIN}
    WHERE ${where} AND cc.subscribed = 1
    ORDER BY c.balance DESC
    LIMIT 10
  `;
  const res = db.query(sql);
  return res.map(r => ({
    id: r.id,
    age: r.age,
    job: r.job || 'Unknown',
    balance: r.balance,
    subscribed: r.subscribed === 1
  }));
});

export const getClientDetails = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { id: string, age: number, job: string, education: string, balance: number, subscribed: boolean }[] => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT c.id, c.age, c.job, c.education, c.balance, cc.subscribed
    ${BASE_JOIN}
    WHERE ${where}
    LIMIT 100
  `;
  const res = db.query(sql);
  return res.map(r => ({
    id: r.id,
    age: r.age,
    job: r.job || 'Unknown',
    education: r.education || 'Unknown',
    balance: r.balance,
    subscribed: r.subscribed === 1
  }));
});

// Loan and cross-sell metrics for Loans page
export const getLoanBalances = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { avg_balance_holders: number, avg_balance_non_holders: number } => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT 
      AVG(CASE WHEN c.housing_loan = 1 OR c.personal_loan = 1 THEN c.balance END) as avg_balance_holders,
      AVG(CASE WHEN c.housing_loan = 0 AND c.personal_loan = 0 THEN c.balance END) as avg_balance_non_holders
    FROM customers c
    WHERE c.id IN (SELECT c.id ${BASE_JOIN} WHERE ${where})
  `;
  const res = db.query(sql);
  return {
    avg_balance_holders: Math.round(res[0]?.avg_balance_holders || 0),
    avg_balance_non_holders: Math.round(res[0]?.avg_balance_non_holders || 0)
  };
});

export const getLoanUptakeByJob = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { job: string, uptake_rate: number }[] => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT 
      c.job, 
      CAST(SUM(CASE WHEN c.housing_loan = 1 OR c.personal_loan = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) as uptake_rate
    ${BASE_JOIN}
    WHERE ${where} AND c.job IS NOT NULL
    GROUP BY c.job
    ORDER BY uptake_rate DESC
  `;
  const res = db.query(sql);
  return res.map(r => ({
    job: r.job,
    uptake_rate: r.uptake_rate
  }));
});

export const getLoanUptakeTrend = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { month: string, uptake_rate: number }[] => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT 
      strftime('%Y-%m', cc.contact_date) as month,
      CAST(SUM(CASE WHEN c.housing_loan = 1 OR c.personal_loan = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) as uptake_rate
    ${BASE_JOIN}
    WHERE ${where}
    GROUP BY month
    ORDER BY month
  `;
  const res = db.query(sql);
  return res.map(r => ({
    month: r.month,
    uptake_rate: r.uptake_rate
  }));
});

export const getLoanSplit = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { housing_only: number, personal_only: number, both: number, neither: number } => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT 
      SUM(CASE WHEN c.housing_loan = 1 AND c.personal_loan = 0 THEN 1 ELSE 0 END) as housing_only,
      SUM(CASE WHEN c.housing_loan = 0 AND c.personal_loan = 1 THEN 1 ELSE 0 END) as personal_only,
      SUM(CASE WHEN c.housing_loan = 1 AND c.personal_loan = 1 THEN 1 ELSE 0 END) as both,
      SUM(CASE WHEN c.housing_loan = 0 AND c.personal_loan = 0 THEN 1 ELSE 0 END) as neither
    FROM customers c
    WHERE c.id IN (SELECT c.id ${BASE_JOIN} WHERE ${where})
  `;
  const res = db.query(sql);
  return {
    housing_only: res[0]?.housing_only || 0,
    personal_only: res[0]?.personal_only || 0,
    both: res[0]?.both || 0,
    neither: res[0]?.neither || 0
  };
});

export const getLoanSegmentBreakdown = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { loan_segment: string, client_count: number, conversion_rate: number }[] => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT 
      CASE 
        WHEN c.housing_loan = 1 AND c.personal_loan = 0 THEN 'Housing Only'
        WHEN c.housing_loan = 0 AND c.personal_loan = 1 THEN 'Personal Only'
        WHEN c.housing_loan = 1 AND c.personal_loan = 1 THEN 'Both'
        ELSE 'Neither'
      END as loan_segment,
      COUNT(DISTINCT c.id) as client_count,
      CAST(SUM(cc.subscribed) AS FLOAT) / COUNT(*) as conversion_rate
    ${BASE_JOIN}
    WHERE ${where}
    GROUP BY loan_segment
    ORDER BY conversion_rate DESC
  `;
  const res = db.query(sql);
  return res.map(r => ({
    loan_segment: r.loan_segment,
    client_count: r.client_count,
    conversion_rate: r.conversion_rate
  }));
});

// Branch leaderboard metric for Branches page
export const getBranchLeaderboard = memoizeMetric((db: QueryExecutor, ctx?: FilterContext): { branch_id: string, name: string, region: string, lat: number, lng: number, client_count: number, avg_balance: number, conversion_rate: number }[] => {
  const where = buildWhereClause(ctx);
  const sql = `
    SELECT 
      b.branch_id, b.name, b.region, b.lat, b.lng,
      COUNT(DISTINCT c.id) as client_count,
      AVG(c.balance) as avg_balance,
      CAST(SUM(cc.subscribed) AS FLOAT) / COUNT(*) as conversion_rate
    ${BASE_JOIN} WHERE ${where}
    GROUP BY b.branch_id, b.name, b.region, b.lat, b.lng
    ORDER BY conversion_rate DESC
  `;
  const res = db.query(sql);
  return res.map(r => ({
    branch_id: r.branch_id,
    name: r.name,
    region: r.region,
    lat: r.lat,
    lng: r.lng,
    client_count: r.client_count,
    avg_balance: Math.round(r.avg_balance || 0),
    conversion_rate: r.conversion_rate
  }));
});
