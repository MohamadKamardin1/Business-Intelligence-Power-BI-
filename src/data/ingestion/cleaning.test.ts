import { describe, it, expect } from 'vitest';
import { parseUnknown, parseBoolean, validateAge, cleanPdays, assignSyntheticBranch, getMonthNumber } from './cleaning';

describe('Cleaning Functions', () => {
  it('should parse unknown as null', () => {
    expect(parseUnknown('unknown')).toBeNull();
    expect(parseUnknown('admin.')).toBe('admin.');
  });

  it('should parse boolean values', () => {
    expect(parseBoolean('yes')).toBe(true);
    expect(parseBoolean('no')).toBe(false);
  });

  it('should validate age bounds', () => {
    expect(validateAge('35')).toBe(35);
    expect(validateAge('-5')).toBe(-1);
    expect(validateAge('200')).toBe(-1);
    expect(validateAge('invalid')).toBe(-1);
  });

  it('should clean pdays', () => {
    expect(cleanPdays('999')).toBe(999);
    expect(cleanPdays('-1')).toBeNull();
  });

  it('should assign a branch deterministically', () => {
    const branch1 = assignSyntheticBranch('client_123');
    const branch2 = assignSyntheticBranch('client_123');
    expect(branch1.branch_id).toBe(branch2.branch_id);
    
    const branch3 = assignSyntheticBranch('client_124');
    // It should just return a valid branch
    expect(branch3.branch_id).toBeDefined();
  });

  it('should map month strings to numbers', () => {
    expect(getMonthNumber('may')).toBe(5);
    expect(getMonthNumber('oct')).toBe(10);
  });
});
