# HydRent

HydRent is a trust-first, community-driven rent intelligence and rental transparency platform for Hyderabad. It is not a listing marketplace, broker tool, lead generation system, or property hosting platform. It is a civic data product focused on showing realistic rent expectations from verified community signals.

The product is inspired conceptually by the rent-transparency movement, but the implementation focuses on stronger verification architecture, anomaly-resistant statistics, scalable data modeling, mobile-first UX, open-source documentation, and programmatic SEO.

## What HydRent Shows

- Realistic locality and building rent ranges.
- Closed rent, renewed rent, and asking rent as separate evidence classes.
- Weighted medians instead of simple averages.
- P10, P25, P75, and P90 rent bands.
- Confidence scores based on sample size, freshness, variance, and verification ratio.
- Trust scoring that explains why data is weighted.
- Anomaly flags for suspicious broker inflation, duplicate patterns, and coordinated spam.
- Programmatic SEO pages for localities, BHK searches, furnished searches, buildings, and comparisons.

## Tech Stack

- Next.js App Router with React and TypeScript.
- Tailwind CSS and shadcn-style source-owned UI primitives.
- Prisma ORM with PostgreSQL/Supabase.
- Recharts for lightweight visualization.
- Leaflet and OpenStreetMap for free-tier-friendly maps.
- TanStack Table for moderation tooling.
- Zod for validation.
- Zustand for small client state.
- Sentry-ready structured logging and PostHog-ready analytics hooks.

## Quick Start

```bash
npm install
cp .env.example .env
npm run db:generate
npm run dev
```

Open `http://localhost:3000`.

For a local PostgreSQL database:

```bash
npm run db:migrate
npm run db:seed
```

The app can run from seeded in-repo data before a database is connected, which keeps the project easy to review on free-tier infrastructure.

## Key Routes

- `/` city overview and search.
- `/hyderabad/gachibowli` locality report.
- `/hyderabad/kondapur/2bhk` BHK SEO report.
- `/building/prestige-high-fields` building intelligence.
- `/locality/madhapur/furnished` filtered SEO report.
- `/compare/gachibowli-vs-kondapur` locality comparison.
- `/how-data-works` trust, privacy, and aggregation methodology.
- `/submit` rent submission flow.
- `/admin` moderation dashboard foundation.

## Documentation

- [Architecture](docs/architecture.md)
- [Database Schema](docs/database-schema.md)
- [Trust System](docs/trust-system.md)
- [Verification Engine](docs/verification-engine.md)
- [Moderation System](docs/moderation-system.md)
- [Statistical Methods](docs/statistical-methods.md)
- [SEO Strategy](docs/seo-strategy.md)
- [API Documentation](docs/api.md)
- [Environment Setup](docs/environment-setup.md)
- [Seed Data](docs/seed-data.md)
- [Deployment Guide](docs/deployment-guide.md)
- [Engineering Standards](docs/engineering-standards.md)
- [Scalability Roadmap](docs/scalability-roadmap.md)
- [Onboarding Guide](docs/onboarding-guide.md)

## Open-Source Positioning

HydRent is structured as an academic-quality civic-tech project. The repository includes a transparent trust model, statistical methods documentation, moderation principles, schema docs, contributor guide, MIT license, issue templates, and a PR template.

Seed data is illustrative. Production deployments should label imported estimates, proof-backed submissions, and community-verified rents distinctly.
