import { atom } from 'nanostores';
import type { FilterContext, QueryExecutor } from '../metrics/context';
import { getQueryExecutor } from './db';

export const filterStore = atom<FilterContext>({});
export const dbStore = atom<QueryExecutor | null>(null);
export const dbLoadingStore = atom<boolean>(true);
export const dbErrorStore = atom<string | null>(null);

// --- URL ↔ Store Sync ---
const FILTER_KEYS: (keyof FilterContext)[] = [
  'branch_id', 'job', 'education', 'marital',
  'has_housing_loan', 'has_personal_loan', 'campaign'
];

function filtersFromURL(): FilterContext {
  const params = new URLSearchParams(window.location.search);
  const ctx: FilterContext = {};
  for (const key of FILTER_KEYS) {
    const val = params.get(key);
    if (val !== null && val !== '') {
      if (key === 'has_housing_loan' || key === 'has_personal_loan') {
        (ctx as any)[key] = val === 'true';
      } else if (key === 'campaign') {
        (ctx as any)[key] = Number(val);
      } else {
        (ctx as any)[key] = val;
      }
    }
  }
  return ctx;
}

function filtersToURL(ctx: FilterContext) {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const val = (ctx as any)[key];
    if (val !== undefined && val !== null && val !== '') {
      params.set(key, String(val));
    }
  }
  const qs = params.toString();
  const newURL = window.location.pathname + (qs ? '?' + qs : '');
  history.replaceState(null, '', newURL);
}

// Initialize store from URL on first load
filterStore.set(filtersFromURL());

// Auto-sync store changes back to URL
filterStore.subscribe(ctx => {
  filtersToURL(ctx);
});

// --- Active filter helpers ---
const FILTER_LABELS: Record<string, string> = {
  branch_id: 'Branch',
  job: 'Job',
  education: 'Education',
  marital: 'Marital',
  has_housing_loan: 'Housing Loan',
  has_personal_loan: 'Personal Loan',
  campaign: 'Campaign',
};

export function getActiveFilterChips(): { key: keyof FilterContext; label: string; value: string }[] {
  const ctx = filterStore.get();
  const chips: { key: keyof FilterContext; label: string; value: string }[] = [];
  for (const key of FILTER_KEYS) {
    const val = (ctx as any)[key];
    if (val !== undefined && val !== null && val !== '') {
      chips.push({
        key: key,
        label: FILTER_LABELS[key] || key,
        value: String(val)
      });
    }
  }
  return chips;
}

// --- Database init ---
export async function initDatabase() {
  try {
    const executor = await getQueryExecutor();
    dbStore.set(executor);
    dbLoadingStore.set(false);
  } catch (err: any) {
    dbErrorStore.set(err.message || 'Failed to initialize database.');
    dbLoadingStore.set(false);
  }
}

export function updateFilter(key: keyof FilterContext, value: any) {
  const current = filterStore.get();
  if (value === null || value === undefined || value === '') {
    const next = { ...current };
    delete next[key];
    filterStore.set(next);
  } else {
    filterStore.set({ ...current, [key]: value });
  }
}

export function clearFilters() {
  filterStore.set({});
}
