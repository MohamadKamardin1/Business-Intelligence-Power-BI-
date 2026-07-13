# Project Context & Roadmap

**Dataset:** UCI Bank Marketing (`bank-full.csv`).
- No native "branch" or geo field exists. A synthetic branch dimension (name, region, lat/lng) must be generated and clearly labeled as simulated/augmented data.
- **Deposits:** Mapped to the `balance` field + term deposit subscription outcome (`y`).
- **Loans:** Mapped to the `housing` + `loan` boolean flags. These should be analyzed as uptake/cross-sell metrics, not as a product catalog.

## Deliverables
To reproduce alongside the app, ensure the following deliverables are completed:
1. Cleaned dataset export.
2. Data model diagram.
3. Metrics documentation (DAX-equivalent).
4. 4 Dashboard pages (Overview, Customers, Loans, Branches).
5. Written insights report.
