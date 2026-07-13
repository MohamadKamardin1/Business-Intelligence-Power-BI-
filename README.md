# Banking Analytics Dashboard

This project is a modern analytics dashboard built with Vite, Lit, TypeScript, and Nanostores for state management. It visualizes data based on the UCI Bank Marketing dataset.

## Dataset Mapping & Assumptions

The dashboard utilizes the UCI Bank Marketing dataset, adapting its structure for analytical purposes:

- **Missing Data Mitigation:** The original UCI dataset lacks geographical and branch-level data. To support the "Branches" perspective of the dashboard, branch and geographic data will be synthesized programmatically during the data ingestion phase.
- **Deposits:** The `y` column (has the client subscribed to a term deposit?) maps to our primary conversion/deposit metrics.
- **Loans:** The `housing` (has housing loan?) and `loan` (has personal loan?) features map directly to the loan analytics.

## Folder Structure

- `src/data`: Data ingestion, synthesization logic, and data models.
- `src/metrics`: Analytics layer for aggregating and computing metrics.
- `src/components`: Shared, reusable Lit components (buttons, cards, layout pieces).
- `src/pages`: Feature-specific page components (Overview, Customers, Loans, Branches).
- `src/store`: Global state management using Nanostores (handles cross-page slicers/filters).
- `src/styles`: Design tokens and global CSS (premium aesthetic with CSS vars).
