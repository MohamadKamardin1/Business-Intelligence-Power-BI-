import { describe, it, expect } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import './kpi-card';
import type { KpiCard } from './kpi-card';

describe('kpi-card component', () => {
  it('renders label and value', async () => {
    const el = await fixture<KpiCard>(html`<kpi-card label="Total Customers" value="1,200"></kpi-card>`);
    
    // Using shadow root to query elements inside the component
    const labelEl = el.shadowRoot?.querySelector('.label');
    const valueEl = el.shadowRoot?.querySelector('.value');
    
    expect(labelEl?.textContent?.trim()).toBe('Total Customers');
    expect(valueEl?.textContent?.trim()).toBe('1,200');
  });

  it('renders positive delta correctly', async () => {
    const el = await fixture<KpiCard>(html`<kpi-card label="Test" value="10" .delta="${5.5}"></kpi-card>`);
    const trendEl = el.shadowRoot?.querySelector('.trend');
    
    expect(trendEl?.classList.contains('positive')).toBe(true);
    expect(trendEl?.textContent?.trim()).toContain('↑');
    expect(trendEl?.textContent?.trim()).toContain('5.5%');
  });

  it('renders negative delta correctly', async () => {
    const el = await fixture<KpiCard>(html`<kpi-card label="Test" value="10" .delta="${-2.3}"></kpi-card>`);
    const trendEl = el.shadowRoot?.querySelector('.trend');
    
    expect(trendEl?.classList.contains('negative')).toBe(true);
    expect(trendEl?.textContent?.trim()).toContain('↓');
    expect(trendEl?.textContent?.trim()).toContain('2.3%');
  });

  it('handles inverse delta correctly (lower is better)', async () => {
    const el = await fixture<KpiCard>(html`<kpi-card label="Test" value="10" .delta="${-1.5}" inverse="true"></kpi-card>`);
    const trendEl = el.shadowRoot?.querySelector('.trend');
    
    // With inverse, a negative delta should be styled as positive (good)
    expect(trendEl?.classList.contains('positive')).toBe(true);
  });
});
