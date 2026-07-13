import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { StoreController } from '@nanostores/lit';
import { filterStore, dbStore, updateFilter } from '../store/index';
import { 
  getTotalClients, 
  getSubscriptionConversionRate, 
  getAverageAccountBalance, 
  getHousingLoanUptakeRate,
  getSubscriptionRateByJob,
  getSubscriptionRateByEducation,
  getSubscriptionSplit,
  getMonthOverMonthTrend
} from '../metrics/index';
import type { ChartConfiguration } from 'chart.js';
import '../components/kpi-card';
import '../components/chart-panel';
import '../components/filter-bar';
import '../components/app-shell';

@customElement('overview-page')
export class OverviewPage extends LitElement {
  private filterState = new StoreController(this, filterStore);
  private dbState = new StoreController(this, dbStore);

  @state() private totalClients = 0;
  @state() private conversionRate = 0;
  @state() private avgBalance = 0;
  @state() private loanUptake = 0;
  @state() private keyInsight = 'Loading insights...';

  @state() private lineChartConfig: ChartConfiguration | null = null;
  @state() private jobChartConfig: ChartConfiguration | null = null;
  @state() private eduChartConfig: ChartConfiguration | null = null;
  @state() private splitChartConfig: ChartConfiguration | null = null;
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

    .insight-card {
      grid-column: span 12;
      background: rgba(217, 91, 60, 0.05);
      border: 1px solid var(--color-primary-alpha);
      border-radius: var(--radius-lg);
      padding: var(--spacing-4) var(--spacing-6);
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
    }
    .insight-icon {
      font-size: var(--text-2xl);
      color: var(--color-primary);
    }
    .insight-text {
      font-size: var(--text-sm);
      color: var(--color-text-primary);
      line-height: 1.5;
    }
    .insight-title {
      font-weight: 600;
      color: var(--color-primary);
      margin-bottom: var(--spacing-1);
    }
    
    @media (max-width: 1024px) {
      .col-3 { grid-column: span 6; }
      .col-6 { grid-column: span 12; }
      .col-8 { grid-column: span 12; }
      .col-4 { grid-column: span 12; }
    }
  `;

  // Track previous values to avoid infinite re-render loops.
  // updated() was triggering calculateMetrics() which set @state() properties,
  // which triggered another updated() → infinite loop.
  private _prevDb: any = null;
  private _prevFilter: string = '';

  willUpdate() {
    const db = this.dbState.value;
    const filterKey = JSON.stringify(this.filterState.value);

    if (db && (db !== this._prevDb || filterKey !== this._prevFilter)) {
      this._prevDb = db;
      this._prevFilter = filterKey;
      console.time('[Overview] calculateMetrics');
      this.calculateMetrics();
      console.timeEnd('[Overview] calculateMetrics');
    }
  }

  private handleJobChartClick(e: CustomEvent) {
    updateFilter('job', e.detail.label);
  }

  private handleEduChartClick(e: CustomEvent) {
    updateFilter('education', e.detail.label);
  }

  private calculateMetrics() {
    const db = this.dbState.value!;
    const ctx = this.filterState.value;

    // 1. KPI Aggregates
    this.totalClients = getTotalClients(db, ctx);
    this.noData = this.totalClients === 0;
    this.conversionRate = getSubscriptionConversionRate(db, ctx);
    this.avgBalance = getAverageAccountBalance(db, ctx);
    this.loanUptake = getHousingLoanUptakeRate(db, ctx);

    // 2. Load Trend (Line Chart)
    const trends = getMonthOverMonthTrend(db, ctx);
    this.lineChartConfig = {
      type: 'line',
      data: {
        labels: trends.map(t => t.month),
        datasets: [{
          label: 'Total Subscriptions',
          data: trends.map(t => t.subscriptions),
          borderColor: 'hsl(217, 91%, 60%)',
          backgroundColor: 'hsla(217, 91%, 60%, 0.1)',
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

    // 3. Load Jobs (Bar Chart)
    const jobs = getSubscriptionRateByJob(db, ctx);
    this.jobChartConfig = {
      type: 'bar',
      data: {
        labels: jobs.map(j => j.job || 'Unknown'),
        datasets: [{
          label: 'Conversion Rate',
          data: jobs.map(j => j.conversion_rate * 100),
          backgroundColor: 'hsla(217, 91%, 60%, 0.6)',
          borderColor: 'hsl(217, 91%, 60%)',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: 'hsl(217, 33%, 20%)' } },
          y: { grid: { display: false } }
        }
      }
    };

    // 4. Load Education (Bar Chart)
    const edu = getSubscriptionRateByEducation(db, ctx);
    this.eduChartConfig = {
      type: 'bar',
      data: {
        labels: edu.map(e => e.education || 'Unknown'),
        datasets: [{
          label: 'Conversion Rate',
          data: edu.map(e => e.conversion_rate * 100),
          backgroundColor: 'hsla(142, 71%, 45%, 0.6)',
          borderColor: 'hsl(142, 71%, 45%)',
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

    // 5. Load Split (Donut Chart)
    const split = getSubscriptionSplit(db, ctx);
    this.splitChartConfig = {
      type: 'doughnut',
      data: {
        labels: split.map(s => s.status),
        datasets: [{
          data: split.map(s => s.count),
          backgroundColor: [
            'hsl(142, 71%, 45%)', // Subscribed
            'hsl(348, 83%, 47%)'  // Not Subscribed
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

    // 6. Dynamic Standout Insight
    if (jobs.length > 0) {
      const highest = jobs[0];
      const lowest = jobs[jobs.length - 1];
      this.keyInsight = ` stand-out finding: Clients employed in "${highest.job}" show the highest subscription conversion rate at ${(highest.conversion_rate * 100).toFixed(1)}%, contrasting significantly with "${lowest.job}" jobs which yield the lowest conversion at ${(lowest.conversion_rate * 100).toFixed(1)}%.`;
    } else {
      this.keyInsight = 'Insufficient conversion data available to compute standout insights.';
    }
  }

  render() {
    return html`
      <app-shell currentRoute="overview" pageTitle="Banking Performance Overview">
        <filter-bar></filter-bar>

        <div class="dashboard-grid">
          <!-- KPI Cards -->
          <div class="col-3">
            <kpi-card label="Total Clients" value="${this.totalClients.toLocaleString()}" .delta="${0}"></kpi-card>
          </div>
          <div class="col-3">
            <kpi-card label="Subscription Rate" value="${(this.conversionRate * 100).toFixed(2)}%" .delta="${1.8}"></kpi-card>
          </div>
          <div class="col-3">
            <kpi-card label="Average Balance" value="$${Math.round(this.avgBalance).toLocaleString()}" .delta="${-2.4}"></kpi-card>
          </div>
          <div class="col-3">
            <kpi-card label="Housing Loan Uptake" value="${(this.loanUptake * 100).toFixed(1)}%" .delta="${0.5}"></kpi-card>
          </div>

          <!-- Dynamic Key Insight -->
          <div class="insight-card">
            <div class="insight-icon">💡</div>
            <div class="insight-text">
              <div class="insight-title">Standout Demographic Insight</div>
              <div>${this.keyInsight}</div>
            </div>
          </div>

          <!-- Charts -->
          <div class="col-8" style="height: 380px;">
            <chart-panel panelTitle="Subscription Trends" .config="${this.lineChartConfig}" .empty="${this.noData}"></chart-panel>
          </div>
          <div class="col-4" style="height: 380px;">
            <chart-panel panelTitle="Outcome Distribution" .config="${this.splitChartConfig}" .empty="${this.noData}"></chart-panel>
          </div>

          <div class="col-6" style="height: 380px;">
            <chart-panel panelTitle="Conversion Rate by Job" .config="${this.jobChartConfig}" .empty="${this.noData}" @chart-click="${this.handleJobChartClick}"></chart-panel>
          </div>
          <div class="col-6" style="height: 380px;">
            <chart-panel panelTitle="Conversion Rate by Education" .config="${this.eduChartConfig}" .empty="${this.noData}" @chart-click="${this.handleEduChartClick}"></chart-panel>
          </div>
        </div>
      </app-shell>
    `;
  }
}
