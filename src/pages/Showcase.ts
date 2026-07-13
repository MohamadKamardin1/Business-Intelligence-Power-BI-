import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../components/kpi-card';
import '../components/chart-panel';
import '../components/filter-bar';
import '../components/data-table';
import '../components/app-shell';

@customElement('showcase-page')
export class ShowcasePage extends LitElement {
  static styles = css`
    .showcase-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: var(--spacing-6);
    }
    .col-3 { grid-column: span 3; }
    .col-4 { grid-column: span 4; }
    .col-6 { grid-column: span 6; }
    .col-8 { grid-column: span 8; }
    .col-12 { grid-column: span 12; }
    
    h2 {
      grid-column: span 12;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: var(--spacing-2);
      margin-top: var(--spacing-8);
      color: var(--color-primary);
      font-size: var(--text-2xl);
    }
  `;

  private mockChartConfig = {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Subscriptions',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: 'hsla(217, 91%, 60%, 0.5)',
        borderColor: 'hsl(217, 91%, 60%)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    }
  };

  private mockTableData = [
    { id: 1, name: 'John Doe', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', role: 'Manager', status: 'Active' },
    { id: 3, name: 'Bob Johnson', role: 'Technician', status: 'Inactive' },
    { id: 4, name: 'Alice Williams', role: 'Admin', status: 'Active' },
    { id: 5, name: 'Charlie Brown', role: 'Manager', status: 'Inactive' },
    { id: 6, name: 'David Miller', role: 'Technician', status: 'Active' },
  ];

  render() {
    return html`
      <app-shell currentRoute="showcase" pageTitle="UI Component Showcase">
        <div class="showcase-grid">
          <h2 style="margin-top: 0">Filter Bar</h2>
          <div class="col-12">
            <filter-bar></filter-bar>
          </div>

          <h2>KPI Cards</h2>
          <div class="col-3">
            <kpi-card label="Total Revenue" value="$45,231" delta="12.5"></kpi-card>
          </div>
          <div class="col-3">
            <kpi-card label="Conversion Rate" value="4.2%" delta="-1.1"></kpi-card>
          </div>
          <div class="col-3">
            <kpi-card label="Active Users" value="1,204" delta="0"></kpi-card>
          </div>
          <div class="col-3">
            <kpi-card label="Churn Rate" value="2.1%" delta="0.5" inverse="true"></kpi-card>
          </div>

          <h2>Charts & Panels</h2>
          <div class="col-6" style="height: 400px;">
            <chart-panel panelTitle="Monthly Subscriptions" .config="${this.mockChartConfig as any}"></chart-panel>
          </div>
          <div class="col-6" style="height: 400px;">
            <chart-panel panelTitle="Loading State" loading="true"></chart-panel>
          </div>

          <h2>Data Tables</h2>
          <div class="col-12">
            <data-table 
              .columns="${[
                {key: 'name', label: 'Name'}, 
                {key: 'role', label: 'Role'}, 
                {key: 'status', label: 'Status'}
              ]}"
              .data="${this.mockTableData}"
            ></data-table>
          </div>
        </div>
      </app-shell>
    `;
  }
}
