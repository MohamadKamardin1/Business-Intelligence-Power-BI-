import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { StoreController } from '@nanostores/lit';
import { filterStore, dbStore, updateFilter } from '../store/index';
import {
  getAverageAge,
  getAverageAccountBalance,
  getDefaultRate,
  getMarriedRate,
  getBalanceDistributionByAge,
  getCustomerSegments,
  getTopCustomers,
  getClientDetails
} from '../metrics/index';
import type { ChartConfiguration } from 'chart.js';
import '../components/kpi-card';
import '../components/chart-panel';
import '../components/filter-bar';
import '../components/data-table';
import '../components/app-shell';

@customElement('customers-page')
export class CustomersPage extends LitElement {
  private filterState = new StoreController(this, filterStore);
  private dbState = new StoreController(this, dbStore);

  @state() private avgAge = 0;
  @state() private avgBalance = 0;
  @state() private defaultRate = 0;
  @state() private marriedRate = 0;

  @state() private balanceAgeConfig: ChartConfiguration | null = null;
  
  @state() private segments: any[] = [];
  @state() private topCustomers: any[] = [];
  @state() private clientsList: any[] = [];
  
  @state() private showDrilldown = false;
  @state() private drilldownSegment = '';
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
    
    .drilldown-panel {
      grid-column: span 12;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-primary);
      border-radius: var(--radius-lg);
      padding: var(--spacing-5);
      animation: fadeIn 0.3s ease-out;
    }
    .drilldown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-4);
    }
    .drilldown-title {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-primary);
      margin: 0;
    }
    .close-btn {
      background: transparent;
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: var(--spacing-1) var(--spacing-3);
      border-radius: var(--radius-sm);
      transition: var(--transition-fast);
    }
    .close-btn:hover {
      background: var(--color-bg-surface-hover);
      color: var(--color-text-primary);
      border-color: var(--color-text-primary);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  updated() {
    if (this.dbState.value) {
      this.calculateMetrics();
    }
  }

  private calculateMetrics() {
    const db = this.dbState.value!;
    const ctx = this.filterState.value;

    this.avgAge = getAverageAge(db, ctx);
    this.avgBalance = getAverageAccountBalance(db, ctx);
    this.defaultRate = getDefaultRate(db, ctx);
    this.marriedRate = getMarriedRate(db, ctx);

    // Balance Distribution by Age (Bar Chart)
    const dist = getBalanceDistributionByAge(db, ctx);
    this.noData = dist.length === 0;
    this.balanceAgeConfig = {
      type: 'bar',
      data: {
        labels: dist.map(d => d.age_bracket),
        datasets: [{
          label: 'Average Balance ($)',
          data: dist.map(d => d.avg_balance),
          backgroundColor: 'hsla(217, 91%, 60%, 0.6)',
          borderColor: 'hsl(217, 91%, 60%)',
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

    // Segments matrix (job x education)
    const segmentsData = getCustomerSegments(db, ctx);
    this.segments = segmentsData.map(s => ({
      ...s,
      conversion_rate_pct: `${(s.conversion_rate * 100).toFixed(1)}%`,
      avg_balance_fmt: `$${s.avg_balance.toLocaleString()}`
    }));

    // Top Customers list (Subscribed with highest balances)
    const topData = getTopCustomers(db, ctx);
    this.topCustomers = topData.map(t => ({
      ...t,
      balance_fmt: `$${t.balance.toLocaleString()}`,
      status: t.subscribed ? 'Subscribed' : 'Not Subscribed'
    }));

    // Client details list for drilldown
    this.clientsList = getClientDetails(db, ctx).map(c => ({
      ...c,
      balance_fmt: `$${c.balance.toLocaleString()}`,
      status: c.subscribed ? 'Subscribed' : 'Not Subscribed'
    }));

    // If segment filters are set, open drilldown details panel
    if (ctx.job && ctx.education) {
      this.showDrilldown = true;
      this.drilldownSegment = `${ctx.job} (Education: ${ctx.education})`;
    } else {
      this.showDrilldown = false;
    }
  }

  private handleSegmentClick(e: CustomEvent) {
    const row = e.detail;
    // Drilldown by setting job and education filters
    updateFilter('job', row.job);
    updateFilter('education', row.education);
  }

  private closeDrilldown() {
    updateFilter('job', '');
    updateFilter('education', '');
  }

  render() {
    return html`
      <app-shell currentRoute="customers" pageTitle="Customer Analytics & Segments">
        <filter-bar></filter-bar>

        <div class="dashboard-grid">
          <!-- KPIs -->
          <div class="col-3">
            <kpi-card label="Average Age" value="${Math.round(this.avgAge)} yrs" .delta="${0}"></kpi-card>
          </div>
          <div class="col-3">
            <kpi-card label="Average Balance" value="$${Math.round(this.avgBalance).toLocaleString()}" .delta="${-1.2}"></kpi-card>
          </div>
          <div class="col-3">
            <kpi-card label="Credit in Default" value="${(this.defaultRate * 100).toFixed(2)}%" .delta="${-0.05}" inverse="true"></kpi-card>
          </div>
          <div class="col-3">
            <kpi-card label="Married Cohort" value="${(this.marriedRate * 100).toFixed(1)}%" .delta="${0.2}"></kpi-card>
          </div>

          <!-- Drill-down Client Detail Panel -->
          ${this.showDrilldown ? html`
            <div class="drilldown-panel">
              <div class="drilldown-header">
                <h4 class="drilldown-title">Segment Client List: ${this.drilldownSegment}</h4>
                <button class="close-btn" @click="${this.closeDrilldown}">Close Drilldown</button>
              </div>
              <data-table
                .columns="${[
                  { key: 'id', label: 'Client ID' },
                  { key: 'age', label: 'Age' },
                  { key: 'balance_fmt', label: 'Account Balance' },
                  { key: 'status', label: 'Subscription Status' }
                ]}"
                .data="${this.clientsList}"
                .itemsPerPage="${5}"
              ></data-table>
            </div>
          ` : ''}

          <!-- Distribution Chart -->
          <div class="col-8" style="height: 380px;">
            <chart-panel panelTitle="Balance Distribution by Age Cohorts" .config="${this.balanceAgeConfig}" .empty="${this.noData}"></chart-panel>
          </div>

          <!-- Top Subscribed Customers -->
          <div class="col-4">
            <chart-panel panelTitle="Top Valued Customers (Subscribed)" .empty="${this.topCustomers.length === 0}">
              <data-table
                slot="action"
                .columns="${[
                  { key: 'id', label: 'Client' },
                  { key: 'job', label: 'Job' },
                  { key: 'balance_fmt', label: 'Balance' }
                ]}"
                .data="${this.topCustomers}"
                .itemsPerPage="${5}"
              ></data-table>
            </chart-panel>
          </div>

          <!-- Segments Table -->
          <div class="col-12">
            <chart-panel panelTitle="Customer Segments (Job & Education Profiling)" .empty="${this.segments.length === 0}">
              <data-table
                .columns="${[
                  { key: 'job', label: 'Job Sector' },
                  { key: 'education', label: 'Education Level' },
                  { key: 'client_count', label: 'Total Clients' },
                  { key: 'avg_balance_fmt', label: 'Average Balance' },
                  { key: 'conversion_rate_pct', label: 'Conversion Rate' }
                ]}"
                .data="${this.segments}"
                .itemsPerPage="${5}"
                @row-click="${this.handleSegmentClick}"
              ></data-table>
            </chart-panel>
          </div>
        </div>
      </app-shell>
    `;
  }
}
