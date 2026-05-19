# Scalability Roadmap

## Phase 1: Local MVP

- Seed data.
- Public SEO pages.
- Trust and statistical engines.
- Submission queue.
- Basic moderation dashboard.

## Phase 2: Verified Community Beta

- Supabase auth.
- OTP verification.
- Private proof upload.
- Community voting.
- Moderator roles.
- Reputation updates.
- Real database-backed aggregation.

## Phase 3: City-Scale Intelligence

- Scheduled trend aggregate jobs.
- Stale data detection.
- Building merge workflow.
- Locality health scores.
- Fraud cluster dashboard.
- Proof redaction pipeline.

## Phase 4: Data Science Portfolio Layer

- Spatial clustering.
- Rent prediction baselines.
- Commute-adjusted affordability.
- Forecast confidence intervals.
- Public methodology notebooks.
- Dataset export with privacy constraints.

## Phase 5: Multi-City Expansion

- City configuration.
- Language normalization.
- Region-specific rent factors.
- Multi-city sitemap generation.
- City-level moderation teams.

## Technical Scaling Notes

- Move in-memory rate limiting to durable storage.
- Materialize `TrendAggregate` and `HistoricalRentSnapshot`.
- Use database indexes for locality, building, BHK, rent type, and submitted date.
- Cache public aggregate reads.
- Keep submission writes isolated from public page reads.
