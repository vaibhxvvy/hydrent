# Seed Data

Seed data lives in `src/lib/data/hyderabad.ts`.

It includes:

- Hyderabad localities.
- Zones.
- Buildings and aliases.
- Rent submissions.
- Trend series.
- Moderation queue examples.

## Purpose

The seed dataset lets reviewers experience HydRent without paid infrastructure or private rental data. It also documents the data shape expected by the analytics engine.

## Labels

Production data must distinguish:

- Seeded listing estimates.
- Manual verification.
- Community-reviewed submissions.
- Proof-backed closed rents.

## Running the Seed Script

```bash
npm run db:migrate
npm run db:seed
```

The seed script upserts city, zone, locality, micro-locality, building, alias, and rent submission rows.

## Data Ethics

Do not seed private tenant details, flat numbers, phone numbers, payment proofs, or agreement scans. Use synthetic or consented records only.
