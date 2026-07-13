import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('data-table')
export class DataTable extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-md);
      width: 100%;
    }
    .table-container {
      width: 100%;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background: var(--color-bg-surface-hover);
      color: var(--color-text-secondary);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: var(--spacing-3) var(--spacing-4);
      border-bottom: 1px solid var(--color-border);
      cursor: pointer;
      user-select: none;
    }
    th:hover {
      color: var(--color-text-primary);
    }
    td {
      padding: var(--spacing-4);
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-primary);
      font-size: var(--text-sm);
    }
    tbody tr {
      transition: var(--transition-fast);
      cursor: pointer;
    }
    tbody tr:hover {
      background: var(--color-bg-surface-hover);
    }
    tbody tr:last-child td {
      border-bottom: none;
    }
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-3) var(--spacing-4);
      background: var(--color-bg-surface);
      border-top: 1px solid var(--color-border);
    }
    .pagination-info {
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
    }
    .pagination-controls {
      display: flex;
      gap: var(--spacing-2);
    }
    button {
      background: var(--color-bg-base);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
      padding: var(--spacing-1) var(--spacing-3);
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
      cursor: pointer;
      transition: var(--transition-fast);
    }
    button:hover:not(:disabled) {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  @property({ type: Array }) columns: { key: string; label: string }[] = [];
  @property({ type: Array }) data: any[] = [];
  @property({ type: Number }) currentPage = 1;
  @property({ type: Number }) itemsPerPage = 5;

  private handleRowClick(row: any) {
    this.dispatchEvent(new CustomEvent('row-click', {
      detail: row,
      bubbles: true,
      composed: true
    }));
  }

  private handleKeyDown(e: KeyboardEvent, row: any) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleRowClick(row);
    }
  }

  private nextPage() {
    if (this.currentPage * this.itemsPerPage < this.data.length) {
      this.currentPage++;
    }
  }

  private prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  render() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const paginatedData = this.data.slice(start, end);
    const totalPages = Math.ceil(this.data.length / this.itemsPerPage);

    return html`
      <div class="table-container">
        <table>
          <thead>
            <tr>
              ${this.columns.map(col => html`<th>${col.label}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${paginatedData.map(row => html`
              <tr 
                role="button"
                tabindex="0"
                @click="${() => this.handleRowClick(row)}"
                @keydown="${(e: KeyboardEvent) => this.handleKeyDown(e, row)}"
              >
                ${this.columns.map(col => html`<td>${row[col.key]}</td>`)}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <div class="pagination-info">
          Showing ${start + 1} to ${Math.min(end, this.data.length)} of ${this.data.length} entries
        </div>
        <div class="pagination-controls">
          <button @click="${this.prevPage}" ?disabled="${this.currentPage === 1}">Previous</button>
          <button @click="${this.nextPage}" ?disabled="${this.currentPage >= totalPages}">Next</button>
        </div>
      </div>
    `;
  }
}
