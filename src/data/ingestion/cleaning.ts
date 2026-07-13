import crypto from 'crypto';
import type { DimBranch } from '../models/schema';

export function parseUnknown(value: string): string | null {
  return value.trim().toLowerCase() === 'unknown' ? null : value.trim();
}

export function parseBoolean(value: string): boolean {
  return value.trim().toLowerCase() === 'yes';
}

export function validateAge(ageStr: string): number {
  const age = parseInt(ageStr, 10);
  return (isNaN(age) || age < 0 || age > 150) ? -1 : age; 
}

export function cleanPdays(pdaysStr: string): number | null {
  const pdays = parseInt(pdaysStr, 10);
  return pdays === -1 ? null : pdays;
}

// Synthetic branch deterministic assignment
const BRANCHES: DimBranch[] = [
  { branch_id: 'BR-101', name: 'Downtown Main', region: 'North', lat: 40.7128, lng: -74.0060, is_synthetic: true },
  { branch_id: 'BR-102', name: 'Westside Plaza', region: 'West', lat: 34.0522, lng: -118.2437, is_synthetic: true },
  { branch_id: 'BR-103', name: 'Southpark Hub', region: 'South', lat: 29.7604, lng: -95.3698, is_synthetic: true },
  { branch_id: 'BR-104', name: 'East End Branch', region: 'East', lat: 41.8781, lng: -87.6298, is_synthetic: true }
];

export function assignSyntheticBranch(clientId: string): DimBranch {
  const hash = crypto.createHash('md5').update(clientId).digest('hex');
  const index = parseInt(hash.substring(0, 8), 16) % BRANCHES.length;
  return BRANCHES[index];
}

export function getBranches(): DimBranch[] {
  return BRANCHES;
}

export function getMonthNumber(monthStr: string): number {
  const months: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };
  return months[monthStr.trim().toLowerCase()] || 1;
}

export function getQuarter(month: number): number {
  return Math.ceil(month / 3);
}
