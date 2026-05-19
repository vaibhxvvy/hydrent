# Contributing to HydRent

HydRent is a civic-tech rent transparency project. Contributions should improve trust, clarity, privacy, or data quality.

## Good Contributions

- Better statistical methods.
- Clearer documentation.
- Accessibility improvements.
- SEO improvements that remain truthful.
- Fraud and moderation tooling.
- Seed data improvements with synthetic or consented data.
- Tests for trust and aggregation logic.

## Boundaries

Do not add broker lead generation, listing marketplace flows, public proof display, tenant identity exposure, or dark-pattern analytics.

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

## Pull Requests

- Keep changes scoped.
- Explain product impact.
- Include screenshots for UI changes.
- Include methodology notes for statistical changes.
- Run typecheck and build when possible.

## Data Ethics

Never commit private rental agreements, phone numbers, flat numbers, payment screenshots, or personally identifiable tenant data.
