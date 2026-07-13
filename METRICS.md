# DAX-Equivalent Metrics Documentation

The following analytics measures have been implemented in pure TypeScript, backed by SQL (via `sql.js`). These functions mimic DAX (Data Analysis Expressions) patterns, where they dynamically respond to a shared filter context (e.g., date slicers, demographic filters).

## Core KPIs

### 1. Total Clients
* **Description**: The distinct count of customers matching the current filter context.
* **SQL Equivalent**: `SELECT COUNT(DISTINCT id) FROM customers`
* **Filter Interaction**: Responds to job, education, and regional branch filters.

### 2. Subscription Conversion Rate
* **Description**: The percentage of clients who subscribed to a term deposit.
* **Logic**: `(Count of Subscribers / Total Clients) * 100`
* **Use Case**: This is the primary business target metric, monitored overall and per demographic segment.

### 3. Average Account Balance
* **Description**: The mean balance held by the current cohort of clients.
* **SQL Equivalent**: `SELECT AVG(balance) FROM customers`
* **Use Case**: Used to identify high-net-worth segments.

## Product Uplift & Cross-Sell

### 4. Housing Loan Uptake Rate
* **Description**: The percentage of clients holding a housing loan.
* **Logic**: `(Count of Clients with Housing Loan / Total Clients) * 100`

### 5. Personal Loan Uptake Rate
* **Description**: The percentage of clients holding a personal loan.
* **Logic**: `(Count of Clients with Personal Loan / Total Clients) * 100`

### 6. Cross-Sell Rate
* **Description**: The percentage of clients holding *both* a housing and a personal loan.
* **Logic**: `(Count of Clients with Both / Total Clients) * 100`
* **Use Case**: Helps identify highly leveraged clients, who statistically show lower term deposit subscription rates.

## Dimensional Metrics

### 7. Balance Distribution by Age Bracket
* **Description**: Computes the average balance grouped into custom age cohorts (< 25, 25-40, 40-60, 60+).
* **Use Case**: Powers the age distribution chart to identify the wealthiest life stages.

### 8. Subscription Rate by Job / Education
* **Description**: Aggregates the conversion rate grouped by the `job` and `education` dimensions.
* **Use Case**: Used for matrix segmentation (e.g., identifying that Management + Tertiary education is a high-converting segment).

### 9. Month-over-Month Trend
* **Description**: Groups total subscriptions by the month of contact, ordering chronologically.
* **Use Case**: Powers the main time-series chart on the Overview dashboard.

### 10. Regional Performance Ranking
* **Description**: Aggregates total clients, average balance, and conversion rate by synthetic branch geography.
* **Use Case**: Maps to Leaflet markers and ranks branches in a leaderboard.

## The Filter Context
Similar to Power BI's `CALCULATE`, all these metrics accept an optional `FilterContext` object:
```typescript
interface FilterContext {
  job?: string;
  education?: string;
  branch_id?: string;
  has_housing_loan?: boolean;
  has_personal_loan?: boolean;
}
```
If a filter is applied via the UI (e.g., clicking the "management" job), all metric SQL queries dynamically generate `WHERE job = 'management'` clauses before executing the aggregation.
