# SEO Strategy

HydRent is built for search because most renters arrive from Google, Reddit, WhatsApp, Telegram, and mobile browsers.

## Route Architecture

Core SEO routes:

- `/hyderabad/gachibowli`
- `/hyderabad/kondapur/2bhk`
- `/building/prestige-high-fields`
- `/locality/madhapur/furnished`
- `/compare/gachibowli-vs-kondapur`

## Metadata

The app implements:

- Server-rendered metadata.
- Canonical URLs.
- OpenGraph metadata.
- Twitter cards.
- Dynamic locality metadata.
- Sitemap generation.
- Robots rules.
- Schema.org Dataset JSON-LD for locality pages.

## Programmatic Content

Locality pages generate:

- Rent summary.
- Verified range.
- Affordability analysis.
- Nearby comparisons.
- FAQs.
- Building links.
- BHK filter links.

The content is data-backed and should stay concise. HydRent should not produce generic filler pages. A page should exist only when it has useful context or a clear fallback label.

## Internal Linking

Every locality should link to:

- BHK pages.
- Furnishing/occupancy pages.
- Buildings in the locality.
- Comparison pages.
- Submission flow.
- Methodology page.

## Indexing Rules

Public intelligence pages should be indexable.

Internal admin and API routes should not be indexed.

## Quality Guardrails

- Do not claim precision beyond the confidence score.
- Label estimated data.
- Avoid single flat numbers as "truth."
- Use ranges and confidence.
- Keep pages mobile readable.
