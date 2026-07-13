export interface FilterContext {
  branch_id?: string;
  job?: string;
  education?: string;
  ageRange?: [number, number];
  dateRange?: [string, string]; // 'YYYY-MM-DD'
  campaign?: number;
  marital?: string;
  has_housing_loan?: boolean;
  has_personal_loan?: boolean;
}

export interface QueryExecutor {
  // Executes SQL and returns an array of row objects { col: value, ... }
  query: (sql: string) => any[];
}
