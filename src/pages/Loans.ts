import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { StoreController } from '@nanostores/lit';
import { filterStore, dbStore, updateFilter } from '../store/index';
import {
  getHousingLoanUptakeRate,
  getPersonalLoanUptakeRate,
  getCrossSellRate,
  getLoanBalances,
  getLoanUptakeByJob,
  getLoanUptakeTrend,
  getLoanSplit,
  getLoanSegmentBreakdown
} from '../metrics/index';
import type { ChartConfiguration } from 'chart.js';
import '../components/kpi-card';
import '../components/chart-panel';
import '../components/filter-bar';
import '../components/data-table';
import '../components/app-shell';

@customElement('loans-page')
export class LoansPage extends LitElement {
  private filterState = new StoreController(this, filterStore);
  private dbState = new StoreController(this, dbStore);

  @state() private housingUptake = 0;
  @state() private personalUptake = 0;
  @state() private crossSell = 0;
  @state() private avgBalanceHolders = 0;
  @state() private avgBalanceNonHolders = 0;

  @state() private uptakeJobConfig: ChartConfiguration | null = null;
  @state() private trendUptakeConfig: ChartConfiguration | null = null;
  @state() private splitChartConfig: ChartConfiguration | null = null;

  @state() private segments: any[] = [];
  @state() private noData = false;

  static styles = css`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: var(--spacing-6);
      margin-top: var(--spacing-6);
    }
    .col-3 { grid-column: span 3; }
    .col-4 { grid-column: span 4; }
    .col-6 { grid-column: span 6; }
    .col-8 { grid-column: span 8; }
    .col-12 { grid-column: span 12; }

    .warning-card {
      grid-column: span 12;
      background: rgba(38, 92, 50, 0.05);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-4) var(--spacing-6);
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
    }
    .warning-icon {
      font-size: var(--text-2xl);
    }
    .warning-text {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      line-height: 1.5;
    }
    .warning-title {
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-1);
    }

    @media (max-width: 1024px) {
      .col-3 { grid-column: span 6; }
      .col-6 { grid-column: span 12; }
      .col-8 { grid-column: span 12; }
      .col-4 { grid-column: span 12; }
    }
  `;

  private _prevDb: any = null;
  private _prevFilter: string = '';

  willUpdate() {
    const db = this.dbState.value;
    const filterKey = JSON.stringify(this.filterState.value);
    if (db && (db !== this._prevDb || filterKey !== this._prevFilter)) {
      this._prevDb = db;
      this._prevFilter = filterKey;
      this.calculateMetrics();
    }
  }

  private calculateMetrics() {
    const db = this.dbState.value!;
    const ctx = this.filterState.value;

    this.housingUptake = getHousingLoanUptakeRate(db, ctx);
    this.personalUptake = getPersonalLoanUptakeRate(db, ctx);
    this.crossSell = getCrossSellRate(db, ctx);
    this.noData = this.housingUptake === 0 && this.personalUptake === 0;
    
    const balances = getLoanBalances(db, ctx);
    this.avgBalanceHolders = balances.avg_balance_holders;
    this.avgBalanceNonHolders = balances.avg_balance_non_holders;

    // Bar chart: Uptake by Job Category
    const jobs = getLoanUptakeByJob(db, ctx);
    this.uptakeJobConfig = {
      type: 'bar',
      data: {
        labels: jobs.map(j => j.job || 'Unknown'),
        datasets: [{
          label: 'Loan Uptake Rate (%)',
          data: jobs.map(j => j.uptake_rate * 100),
          backgroundColor: 'hsla(348, 83%, 47%, 0.6)',
          borderColor: 'hsl(348, 83%, 47%)',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { grid: { color: 'hsl(217, 33%, 20%)' } },
          x: { grid: { display: false } }
        }
      }
    };

    // Line Chart: Trend of Active Loan Contact MoM
    const trend = getLoanUptakeTrend(db, ctx);
    this.trendUptakeConfig = {
      type: 'line',
      data: {
        labels: trend.map(t => t.month),
        datasets: [{
          label: 'Loan Contact Uptake Rate (%)',
          data: trend.map(t => t.uptake_rate * 100),
          borderColor: 'hsl(38, 92%, 50%)',
          backgroundColor: 'hsla(38, 92%, 50%, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { grid: { color: 'hsl(217, 33%, 20%)' } },
          x: { grid: { display: false } }
        }
      }
    };

    // Donut Chart: Split
    const splits = getLoanSplit(db, ctx);
    this.splitChartConfig = {
      type: 'doughnut',
      data: {
        labels: ['Housing Only', 'Personal Only', 'Both (Cross-Sell)', 'Neither'],
        datasets: [{
          data: [splits.housing_only, splits.personal_only, splits.both, splits.neither],
          backgroundColor: [
            'hsl(217, 91%, 60%)', // Housing only
            'hsl(348, 83%, 47%)', // Personal only
            'hsl(38, 92%, 50%)',  // Both
            'hsl(215, 20%, 35%)'  // Neither
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    };

    // Segments breakdown
    const breakdown = getLoanSegmentBreakdown(db, ctx);
    this.segments = breakdown.map(b => ({
      ...b,
      client_count_fmt: b.client_count.toLocaleString(),
      conversion_rate_pct: `${(b.conversion_rate * 100).toFixed(2)}%`
    }));
  }

  private handleJobChartClick(e: CustomEvent) {
    updateFilter('job', e.detail.label);
  }

  render() {
    return html`
      <app-shell currentRoute="loans" pageTitle="Loan Uptake & Cross-Sell Analysis">
        <filter-bar></filter-bar>

        <div class="dashboard-grid">
          <!-- Two-Product landscape callout -->
          <div class="warning-card">
            <div class="warning-icon">📢</div>
            <div class="warning-text">
              <div class="warning-title">Two-Product Landscape Disclaimer</div>
              <div>
                The UCI Bank Marketing dataset records credit exposure using binary indicators for <strong>Housing Loan</strong> and <strong>Personal Loan</strong> products. 
                As such, this page models overall client credit uptake and cross-selling ratios, rather than a broad banking product portfolio catalog.
              </div>
            </div>
          </div>

          <!-- KPIs -->
          <div class="col-3">
            <kpi-card label="Housing Loan Uptake" value="${(this.housingUptake * 100).toFixed(1)}%" .delta="${-0.8}"></kpi-card>
          </div>
          <div class="col-3">
            <kpi-card label="Personal Loan Uptake" value="${(this.personalUptake * 100).toFixed(1)}%" .delta="${0.1}"></kpi-card>
          </div>
          <div class="col-3">
            <kpi-card label="Cross-Sell (Both Loans)" value="${(this.crossSell * 100).toFixed(1)}%" .delta="${0.3}"></kpi-card>
          </div>
          <div class="col-3">
            <kpi-card label="Avg Balance (Holders vs Non)" value="$${this.avgBalanceHolders.toLocaleString()} / $${this.avgBalanceNonHolders.toLocaleString()}" .delta="${0}"></kpi-card>
          </div>

          <!-- Trend Chart -->
          <div class="col-8" style="height: 380px;">
            <chart-panel panelTitle="Uptake Trend by Month of Contact" .config="${this.trendUptakeConfig}" .empty="${this.noData}"></chart-panel>
          </div>

          <!-- Donut Split -->
          <div class="col-4" style="height: 380px;">
            <chart-panel panelTitle="Credit Product Split" .config="${this.splitChartConfig}" .empty="${this.noData}"></chart-panel>
          </div>

          <!-- Uptake by Job -->
          <div class="col-6" style="height: 380px;">
            <chart-panel panelTitle="Overall Loan Uptake Rate by Job Category" .config="${this.uptakeJobConfig}" .empty="${this.noData}" @chart-click="${this.handleJobChartClick}"></chart-panel>
          </div>

          <!-- Segment Table -->
          <div class="col-6" style="height: 380px;">
            <chart-panel panelTitle="Segment Conversion Performance" .empty="${this.segments.length === 0}">
              <data-table
                .columns="${[
                  { key: 'loan_segment', label: 'Loan Portfolio Segment' },
                  { key: 'client_count_fmt', label: 'Client Count' },
                  { key: 'conversion_rate_pct', label: 'Conversion Rate' }
                ]}"
                .data="${this.segments}"
                .itemsPerPage="${4}"
              ></data-table>
            </chart-panel>
          </div>
        </div>
      </app-shell>
    `;
  }
}
