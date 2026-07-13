import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { StoreController } from '@nanostores/lit';
import { filterStore, updateFilter, clearFilters, getActiveFilterChips } from '../store/index';

@customElement('filter-bar')
export class FilterBar extends LitElement {
  private filterState = new StoreController(this, filterStore);

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3);
    }
    .controls {
      display: flex;
      gap: var(--spacing-4);
      background: var(--color-bg-surface);
      padding: var(--spacing-4);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      align-items: center;
      flex-wrap: wrap;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1);
    }
    label {
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    select, input {
      background: var(--color-bg-base);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: var(--spacing-2) var(--spacing-3);
      font-size: var(--text-sm);
      outline: none;
      transition: var(--transition-fast);
      min-width: 140px;
    }
    select:focus, input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px var(--color-primary-alpha);
    }
    button {
      background: var(--color-primary);
      color: white;
      border: none;
      padding: var(--spacing-2) var(--spacing-4);
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition-fast);
      margin-top: auto;
      height: 36px;
    }
    button:hover {
      background: var(--color-primary-hover);
    }
    button.clear {
      background: transparent;
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
    }
    button.clear:hover {
      background: var(--color-bg-surface-hover);
      color: var(--color-text-primary);
    }

    /* Active filter chips row */
    .chips-row {
      display: flex;
      gap: var(--spacing-2);
      flex-wrap: wrap;
      align-items: center;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1);
      background: var(--color-primary-alpha);
      color: var(--color-primary);
      font-size: var(--text-xs);
      font-weight: 600;
      padding: var(--spacing-1) var(--spacing-3);
      border-radius: var(--radius-full);
      border: 1px solid var(--color-primary);
      animation: chipIn 0.2s ease-out;
    }
    .chip-remove {
      cursor: pointer;
      opacity: 0.7;
      font-size: 14px;
      line-height: 1;
    }
    .chip-remove:hover {
      opacity: 1;
    }
    .chips-label {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      font-weight: 500;
    }

    @keyframes chipIn {
      from { opacity: 0; transform: scale(0.85); }
      to { opacity: 1; transform: scale(1); }
    }
  `;

  private handleJobChange(e: Event) {
    updateFilter('job', (e.target as HTMLSelectElement).value);
  }

  private handleRegionChange(e: Event) {
    updateFilter('branch_id', (e.target as HTMLSelectElement).value);
  }

  private handleEducationChange(e: Event) {
    updateFilter('education', (e.target as HTMLSelectElement).value);
  }

  private handleLoanTypeChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    // Clear loan filters first
    updateFilter('has_housing_loan', '');
    updateFilter('has_personal_loan', '');
    if (val === 'housing') updateFilter('has_housing_loan', true);
    else if (val === 'personal') updateFilter('has_personal_loan', true);
    else if (val === 'both') {
      updateFilter('has_housing_loan', true);
      updateFilter('has_personal_loan', true);
    }
  }

  private removeChip(key: string) {
    updateFilter(key as any, '');
  }

  private getLoanSelectValue(): string {
    const f = this.filterState.value;
    if (f.has_housing_loan && f.has_personal_loan) return 'both';
    if (f.has_housing_loan) return 'housing';
    if (f.has_personal_loan) return 'personal';
    return '';
  }

  render() {
    const filters = this.filterState.value;
    const chips = getActiveFilterChips();

    return html`
      <div class="controls">
        <div class="filter-group">
          <label>Job Title</label>
          <select .value="${filters.job || ''}" @change="${this.handleJobChange}">
            <option value="">All Jobs</option>
            <option value="admin.">Admin</option>
            <option value="blue-collar">Blue Collar</option>
            <option value="entrepreneur">Entrepreneur</option>
            <option value="housemaid">Housemaid</option>
            <option value="management">Management</option>
            <option value="retired">Retired</option>
            <option value="self-employed">Self-Employed</option>
            <option value="services">Services</option>
            <option value="student">Student</option>
            <option value="technician">Technician</option>
            <option value="unemployed">Unemployed</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Education</label>
          <select .value="${filters.education || ''}" @change="${this.handleEducationChange}">
            <option value="">All</option>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="tertiary">Tertiary</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Branch / Region</label>
          <select .value="${filters.branch_id || ''}" @change="${this.handleRegionChange}">
            <option value="">All Regions</option>
            <option value="BR-101">Downtown Main (North)</option>
            <option value="BR-102">Westside Plaza (West)</option>
            <option value="BR-103">Southpark Hub (South)</option>
            <option value="BR-104">East End (East)</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Loan Type</label>
          <select .value="${this.getLoanSelectValue()}" @change="${this.handleLoanTypeChange}">
            <option value="">All</option>
            <option value="housing">Housing Loan</option>
            <option value="personal">Personal Loan</option>
            <option value="both">Both Loans</option>
          </select>
        </div>

        <button class="clear" @click="${clearFilters}">Reset All</button>
      </div>

      ${chips.length > 0 ? html`
        <div class="chips-row">
          <span class="chips-label">Active Filters:</span>
          ${chips.map(c => html`
            <span class="chip">
              ${c.label}: ${c.value}
              <span class="chip-remove" @click="${() => this.removeChip(c.key)}">✕</span>
            </span>
          `)}
        </div>
      ` : ''}
    `;
  }
}
