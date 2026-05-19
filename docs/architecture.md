# Architecture Overview

HydRent is designed as a city-scale rent intelligence platform rather than a classifieds marketplace. The architecture separates data collection, verification, statistical aggregation, programmatic SEO, and public presentation.

## Product Boundaries

HydRent does not host listings, connect brokers to tenants, rank landlords, sell leads, or expose individual tenant data. Public pages show aggregated intelligence: rent ranges, confidence, trend lines, heatmaps, verification ratios, and explanatory trust context.

## Application Layers

1. Presentation layer
   - App Router pages in `src/app`.
   - Server components for SEO-readable public pages.
   - Client components only where interactivity is needed: search, charts, maps, onboarding, forms, and admin tables.

2. Domain layer
   - `src/lib/analytics/statistics.ts` contains weighted medians, percentile bands, time decay, confidence scoring, and anomaly statistics.
   - `src/lib/analytics/trust.ts` contains the reputation-weighted trust model.
   - `src/lib/search.ts` contains normalization, alias matching, and typo-tolerant search.

3. Data layer
   - `prisma/schema.prisma` models the production relational database.
   - `src/lib/data/hyderabad.ts` provides reviewable seed data and lets the product run without paid infrastructure.
   - `src/lib/db.ts` lazily initializes Prisma so builds do not fail when runtime database variables are missing.

4. API and mutation layer
   - Route handlers live in `src/app/api`.
   - Server actions handle form mutations in `src/app/submit/actions.ts`.
   - Zod validates all inbound submission payloads.

5. Trust and moderation layer
   - Rent submissions are not directly treated as truth.
   - Submissions pass through trust scoring, anomaly scoring, delayed publishing, community votes, verification logs, and moderation events.

## Rendering Strategy

HydRent uses a hybrid static and dynamic architecture:

- Locality, building, BHK, filter, and comparison pages are SEO-first and can be statically generated or ISR-revalidated.
- Submission and admin surfaces remain dynamic.
- Charts and maps are client-side islands fed by server-rendered data.
- Sitemap and robots routes are generated from data definitions.

## Folder Structure

```text
src/
  app/
    api/                  Public API route handlers
    hyderabad/            Locality and BHK SEO routes
    building/             Building intelligence pages
    compare/              Locality comparison pages
    locality/             Filtered programmatic SEO pages
    submit/               Rent submission flow and server actions
  components/
    admin/                Internal moderation UI
    charts/               Recharts visualizations
    forms/                Client-side form surfaces
    layout/               Header and footer
    maps/                 Leaflet/OpenStreetMap components
    onboarding/           First-run trust education
    rent/                 Rent intelligence cards and meters
    search/               Search UI
    ui/                   shadcn-style source-owned primitives
  lib/
    analytics/            Statistical and trust engines
    data/                 Seed data
    validations/          Zod schemas
```

## Free-Tier Infrastructure

The default stack is intentionally free-tier friendly:

- Vercel free tier for hosting.
- Supabase free tier for PostgreSQL and private object storage.
- OpenStreetMap tiles through Leaflet.
- Recharts instead of heavyweight charting.
- In-repository seed data for demos and academic review.

Production usage should respect OpenStreetMap tile policies or use a compliant tile provider/cache.
