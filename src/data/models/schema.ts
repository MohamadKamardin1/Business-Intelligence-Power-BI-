export interface FactCampaignContact {
  client_id: string; 
  contact_date: string; 
  duration: number;
  campaign: number;
  pdays: number | null; 
  previous: number;
  poutcome: string | null;
  subscribed: boolean; 
}

export interface DimCustomer {
  id: string;
  age: number;
  job: string | null;
  marital: string | null;
  education: string | null;
  default_status: boolean;
  balance: number;
  housing_loan: boolean;
  personal_loan: boolean;
  branch_id: string; 
}

export interface DimLoanProduct {
  type: 'housing' | 'personal';
  description: string;
}

export interface DimDate {
  date: string; 
  day: number;
  month: number;
  quarter: number;
  year: number;
}

// SYNTHETIC DATA
export interface DimBranch {
  branch_id: string; 
  name: string;
  region: string;
  lat: number;
  lng: number;
  is_synthetic: boolean; 
}
