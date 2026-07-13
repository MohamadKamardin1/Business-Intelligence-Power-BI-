import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('kpi-card')
export class KpiCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-5);
      box-shadow: var(--shadow-md);
      transition: var(--transition-smooth);
    }
    :host(:hover) {
      background: var(--color-bg-surface-hover);
      border-color: var(--color-border-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
    .label {
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--spacing-2);
    }
    .value {
      color: var(--color-text-primary);
      font-size: var(--text-3xl);
      font-weight: 700;
      margin: 0;
    }
    .trend {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1);
      font-size: var(--text-sm);
      font-weight: 600;
      margin-top: var(--spacing-3);
      padding: var(--spacing-1) var(--spacing-2);
      border-radius: var(--radius-full);
    }
    .trend.positive {
      color: var(--color-success);
      background: var(--color-success-bg);
    }
    .trend.negative {
      color: var(--color-danger);
      background: var(--color-danger-bg);
    }
    .trend.neutral {
      color: var(--color-warning);
      background: hsla(38, 92%, 50%, 0.1);
    }
  `;

  @property({ type: String }) label = '';
  @property({ type: String }) value = '';
  @property({ type: Number }) delta = 0;
  @property({ type: Boolean }) inverse = false; // if true, positive delta is bad

  render() {
    let trendClass = 'neutral';
    let icon = '•';
    let displayDelta = this.delta > 0 ? `+${this.delta}%` : `${this.delta}%`;
    
    if (this.delta > 0) {
      trendClass = this.inverse ? 'negative' : 'positive';
      icon = '↑';
    } else if (this.delta < 0) {
      trendClass = this.inverse ? 'positive' : 'negative';
      icon = '↓';
    } else {
      displayDelta = '0%';
    }

    return html`
      <div class="label">${this.label}</div>
      <div class="value">${this.value}</div>
      ${this.delta !== 0 ? html`
        <div class="trend ${trendClass}">
          <span>${icon}</span>
          <span>${displayDelta}</span>
        </div>
      ` : ''}
    `;
  }
}
