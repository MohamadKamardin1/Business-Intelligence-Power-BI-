import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import Chart from 'chart.js/auto';
import type { ChartConfiguration } from 'chart.js';

@customElement('chart-panel')
export class ChartPanel extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-5);
      box-shadow: var(--shadow-md);
      height: 100%;
      min-height: 300px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-4);
    }
    .title {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }
    .content {
      position: relative;
      flex: 1;
      width: 100%;
      height: 100%;
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
      cursor: pointer;
    }
    .loading, .empty {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--color-bg-surface);
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
      z-index: 10;
      gap: var(--spacing-2);
    }
    .empty-icon, .loading-icon {
      font-size: 2rem;
      opacity: 0.5;
    }
  `;

  @property({ type: String }) panelTitle = '';
  @property({ type: Boolean }) loading = false;
  @property({ type: Boolean }) empty = false;
  @property({ type: Object }) config: ChartConfiguration | null = null;

  @query('canvas') private canvas!: HTMLCanvasElement;
  private chartInstance: Chart | null = null;

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('config') && this.config && !this.loading && !this.empty) {
      this.initChart();
    }
  }

  private initChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    if (this.config && this.canvas) {
      Chart.defaults.color = 'hsl(215, 20%, 65%)';
      Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
      Chart.defaults.borderColor = 'hsl(217, 33%, 25%)';

      // Inject onClick handler for drill-through
      const configCopy = JSON.parse(JSON.stringify(this.config));
      configCopy.options = configCopy.options || {};
      
      this.chartInstance = new Chart(this.canvas, {
        ...configCopy,
        options: {
          ...configCopy.options,
          onClick: (_event: any, elements: any[]) => {
            if (elements.length > 0 && this.chartInstance) {
              const idx = elements[0].index;
              const datasetIdx = elements[0].datasetIndex;
              const label = this.chartInstance.data.labels?.[idx];
              const value = this.chartInstance.data.datasets?.[datasetIdx]?.data?.[idx];
              
              this.dispatchEvent(new CustomEvent('chart-click', {
                detail: { index: idx, label: String(label), value, datasetIndex: datasetIdx },
                bubbles: true,
                composed: true
              }));
            }
          }
        }
      });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  render() {
    return html`
      <div class="header">
        <h3 class="title">${this.panelTitle}</h3>
        <slot name="action"></slot>
      </div>
      <div class="content">
        ${this.loading ? html`<div class="loading"><span class="loading-icon">⏳</span><span>Loading data...</span></div>` : ''}
        ${this.empty && !this.loading ? html`<div class="empty"><span class="empty-icon">📭</span><span>No data available for current filters</span></div>` : ''}
        <canvas 
          role="img" 
          aria-label="${this.panelTitle} chart" 
          tabindex="0"
        ></canvas>
      </div>
    `;
  }
}
