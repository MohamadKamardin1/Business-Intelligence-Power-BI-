import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('app-shell')
export class AppShell extends LitElement {
  static styles = css`
    :host {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background: var(--color-bg-base);
    }
    .sidebar {
      width: 260px;
      background: var(--color-bg-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      padding: var(--spacing-6) 0;
    }
    .brand {
      padding: 0 var(--spacing-6) var(--spacing-6);
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--color-primary);
      border-bottom: 1px solid var(--color-border);
      margin-bottom: var(--spacing-4);
    }
    .nav {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1);
      padding: 0 var(--spacing-4);
    }
    .nav-item {
      display: block;
      padding: var(--spacing-3) var(--spacing-4);
      color: var(--color-text-secondary);
      text-decoration: none;
      border-radius: var(--radius-md);
      font-weight: 500;
      transition: var(--transition-fast);
    }
    .nav-item:hover {
      background: var(--color-bg-surface-hover);
      color: var(--color-text-primary);
    }
    .nav-item.active {
      background: var(--color-primary-alpha);
      color: var(--color-primary);
    }
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .header {
      height: 64px;
      background: var(--color-bg-surface);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      padding: 0 var(--spacing-6);
    }
    .page-title {
      font-size: var(--text-xl);
      font-weight: 600;
      margin: 0;
    }
    .content-scroll {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-6);
    }
  `;

  @property({ type: String }) currentRoute = 'overview';
  @property({ type: String }) pageTitle = 'Overview';

  render() {
    return html`
      <div class="sidebar">
        <div class="brand">DataBank Pro</div>
        <div class="nav">
          <a href="/" class="nav-item ${this.currentRoute === 'overview' ? 'active' : ''}">Overview</a>
          <a href="/customers" class="nav-item ${this.currentRoute === 'customers' ? 'active' : ''}">Customers</a>
          <a href="/loans" class="nav-item ${this.currentRoute === 'loans' ? 'active' : ''}">Loans</a>
          <a href="/branches" class="nav-item ${this.currentRoute === 'branches' ? 'active' : ''}">Branches</a>
          <a href="/dev/showcase" class="nav-item ${this.currentRoute === 'showcase' ? 'active' : ''}" style="margin-top: 20px; border-top: 1px solid var(--color-border); border-radius: 0;">Showcase UI</a>
        </div>
      </div>
      <div class="main-content">
        <div class="header">
          <h1 class="page-title">${this.pageTitle}</h1>
        </div>
        <div class="content-scroll">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
