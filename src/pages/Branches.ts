import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { StoreController } from '@nanostores/lit';
import { filterStore, dbStore, updateFilter } from '../store/index';
import { getBranchLeaderboard } from '../metrics/index';
import type { ChartConfiguration } from 'chart.js';
import '../components/kpi-card';
import '../components/chart-panel';
import '../components/filter-bar';
import '../components/data-table';
import '../components/app-shell';

@customElement('branches-page')
export class BranchesPage extends LitElement {
  private filterState = new StoreController(this, filterStore);
  private dbState = new StoreController(this, dbStore);

  @state() private totalBranches = 0;
  @state() private topBranchName = 'N/A';
  @state() private avgBalance = 0;
  @state() private conversionRate = 0;
  @state() private bestRegionAnswer = 'Loading region data...';

  @state() private rateChartConfig: ChartConfiguration | null = null;
  @state() private balanceChartConfig: ChartConfiguration | null = null;

  @state() private leaderboard: any[] = [];
  @state() private noData = false;

  private map: any = null;
  private markersGroup: any = null;

  // Use Light DOM to ensure Leaflet CSS classes (popups, controls) render correctly without Shadow DOM boundaries
  createRenderRoot() {
    return this;
  }

  private _prevDb: any = null;
  private _prevFilter: string = '';

  willUpdate() {
    const db = this.dbState.value;
    const filterKey = JSON.stringify(this.filterState.value);
    if (db && (db !== this._prevDb || filterKey !== this._prevFilter)) {
      this._prevDb = db;
      this._prevFilter = filterKey;
      this.calculateMetrics();
      this.updateMapMarkers();
    }
  }

  private calculateMetrics() {
    const db = this.dbState.value!;
    const ctx = this.filterState.value;

    const data = getBranchLeaderboard(db, ctx);
    this.leaderboard = data.map(b => ({
      ...b,
      avg_balance_fmt: `$${b.avg_balance.toLocaleString()}`,
      conversion_rate_pct: `${(b.conversion_rate * 100).toFixed(2)}%`
    }));

    this.totalBranches = data.length;
    this.noData = data.length === 0;

    if (data.length > 0) {
      const topBranch = data[0]; // Sorted by conversion rate desc
      this.topBranchName = topBranch.name;
      
      const totalClients = data.reduce((acc, curr) => acc + curr.client_count, 0);
      const totalBalanceWeighted = data.reduce((acc, curr) => acc + (curr.avg_balance * curr.client_count), 0);
      this.avgBalance = totalClients > 0 ? Math.round(totalBalanceWeighted / totalClients) : 0;
      
      const overallSubscribed = data.reduce((acc, curr) => acc + (curr.conversion_rate * curr.client_count), 0);
      this.conversionRate = totalClients > 0 ? overallSubscribed / totalClients : 0;

      // Find highest sales/deposits region
      // Highest sales = top conversion rate region
      // Highest deposits = top avg balance region
      const salesSorted = [...data].sort((a, b) => b.conversion_rate - a.conversion_rate);
      const depositsSorted = [...data].sort((a, b) => b.avg_balance - a.avg_balance);
      
      this.bestRegionAnswer = `The highest sales region is the ${salesSorted[0]?.region} region (${salesSorted[0]?.name} Branch) with a conversion rate of ${(salesSorted[0]?.conversion_rate * 100).toFixed(1)}%. The highest deposits region is the ${depositsSorted[0]?.region} region (${depositsSorted[0]?.name} Branch) with an average customer balance of $${depositsSorted[0]?.avg_balance.toLocaleString()}.`;
    }

    // Chart: Rate by Branch
    this.rateChartConfig = {
      type: 'bar',
      data: {
        labels: data.map(b => b.name),
        datasets: [{
          label: 'Conversion Rate (%)',
          data: data.map(b => b.conversion_rate * 100),
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

    // Chart: Balance by Branch
    this.balanceChartConfig = {
      type: 'bar',
      data: {
        labels: data.map(b => b.name),
        datasets: [{
          label: 'Average Balance ($)',
          data: data.map(b => b.avg_balance),
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
  }

  private initMap() {
    const L = (window as any).L;
    if (!L) return;

    const mapEl = document.getElementById('leaflet-branch-map');
    if (!mapEl || this.map) return;

    this.map = L.map(mapEl).setView([37.0902, -95.7129], 4);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);
  }

  private updateMapMarkers() {
    const L = (window as any).L;
    if (!L) return;

    // Async fallback in case map container isn't ready
    if (!this.map) {
      setTimeout(() => this.initMap(), 100);
      return;
    }

    this.markersGroup.clearLayers();

    this.leaderboard.forEach(branch => {
      const color = branch.conversion_rate > 0.12 ? 'hsl(142, 71%, 45%)' : 'hsl(348, 83%, 47%)';
      const radius = Math.max(8, Math.min(25, branch.client_count / 800));
      
      const circle = L.circleMarker([branch.lat, branch.lng], {
        radius: radius,
        fillColor: color,
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.6
      });

      circle.bindPopup(`
        <div style="color: #000; font-family: sans-serif;">
          <strong style="font-size: 14px;">${branch.name}</strong><br/>
          <span style="font-size: 12px; color: #555;">Region: ${branch.region}</span><br/>
          <hr style="margin: 6px 0; border: none; border-top: 1px solid #ccc;"/>
          <strong>Clients:</strong> ${branch.client_count.toLocaleString()}<br/>
          <strong>Conv. Rate:</strong> ${(branch.conversion_rate * 100).toFixed(2)}%<br/>
          <strong>Avg Balance:</strong> $${branch.avg_balance.toLocaleString()}
        </div>
      `);

      this.markersGroup.addLayer(circle);
    });

    if (this.leaderboard.length > 0) {
      const coords = this.leaderboard.map(b => [b.lat, b.lng]);
      this.map.fitBounds(coords, { padding: [40, 40] });
    }
  }

  private handleBranchChartClick(e: CustomEvent) {
    const branchName = e.detail.label;
    const branch = this.leaderboard.find(b => b.name === branchName);
    if (branch) {
      updateFilter('branch_id', branch.branch_id);
    }
  }

  private handleRowClick(e: CustomEvent) {
    updateFilter('branch_id', e.detail.branch_id);
  }

  render() {
    return html`
      <style>
        .branches-grid {
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

        .simulated-badge {
          display: inline-flex;
          align-items: center;
          background: var(--color-primary-alpha);
          color: var(--color-primary);
          padding: var(--spacing-1) var(--spacing-3);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid var(--color-primary);
          cursor: help;
        }

        .region-answer-card {
          grid-column: span 12;
          background: rgba(38, 92, 50, 0.05);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-4) var(--spacing-6);
          display: flex;
          align-items: center;
          gap: var(--spacing-4);
        }
        
        .leaflet-container {
          background: var(--color-bg-base);
        }

        @media (max-width: 1024px) {
          .col-3 { grid-column: span 6; }
          .col-6 { grid-column: span 12; }
          .col-8 { grid-column: span 12; }
          .col-4 { grid-column: span 12; }
        }
      </style>

      <app-shell currentRoute="branches" pageTitle="Branch & Regional Performance">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <filter-bar></filter-bar>
          <span class="simulated-badge" title="The original UCI Bank Marketing dataset has no native branch or location attributes. Geographic coordinates and branch names are synthetically augmented for mock analytical modeling.">
            Simulated Regional Data ℹ️
          </span>
        </div>

        <div class="branches-grid">
          <!-- KPIs -->
          <div class="col-3">
            <kpi-card label="Total Branches" value="${this.totalBranches}" .delta="${0}"></kpi-card>
          </div>
          <div class="col-3">
            <kpi-card label="Top Branch" value="${this.topBranchName}" .delta="${0}"></kpi-card>
          </div>
          <div class="col-3">
            <kpi-card label="Avg Client Balance" value="$${Math.round(this.avgBalance).toLocaleString()}" .delta="${0}"></kpi-card>
          </div>
          <div class="col-3">
            <kpi-card label="Overall Conv. Rate" value="${(this.conversionRate * 100).toFixed(2)}%" .delta="${0}"></kpi-card>
          </div>

          <!-- Regional dynamic performance text -->
          <div class="region-answer-card">
            <div style="font-size: var(--text-2xl);">🎯</div>
            <div style="font-size: var(--text-sm); line-height: 1.5; color: var(--color-text-secondary);">
              <strong style="color: var(--color-text-primary); display: block; margin-bottom: 4px;">Dynamic Regional Standouts</strong>
              ${this.bestRegionAnswer}
            </div>
          </div>

          <!-- Leaflet Map -->
          <div class="col-8" style="height: 420px;">
            <chart-panel panelTitle="Synthetic Branch Spatial Mapping (Leaflet)">
              <div id="leaflet-branch-map" style="height: 100%; min-height: 330px; border-radius: var(--radius-md);"></div>
            </chart-panel>
          </div>

          <!-- Leaderboard Table -->
          <div class="col-4" style="height: 420px;">
            <chart-panel panelTitle="Branch Performance Leaderboard" .empty="${this.noData}">
              <data-table
                .columns="${[
                  { key: 'name', label: 'Branch' },
                  { key: 'region', label: 'Region' },
                  { key: 'conversion_rate_pct', label: 'Rate' }
                ]}"
                .data="${this.leaderboard}"
                .itemsPerPage="${5}"
                @row-click="${this.handleRowClick}"
              ></data-table>
            </chart-panel>
          </div>

          <!-- Charts -->
          <div class="col-6" style="height: 380px;">
            <chart-panel panelTitle="Subscription Rate by Branch" .config="${this.rateChartConfig}" .empty="${this.noData}" @chart-click="${this.handleBranchChartClick}"></chart-panel>
          </div>

          <div class="col-6" style="height: 380px;">
            <chart-panel panelTitle="Average Account Balance by Branch" .config="${this.balanceChartConfig}" .empty="${this.noData}" @chart-click="${this.handleBranchChartClick}"></chart-panel>
          </div>
        </div>
      </app-shell>
    `;
  }
}
