# Database Schema

The schema is designed for geographic hierarchy, evidence quality, moderation traceability, and future data science workflows.

## Geographic Hierarchy

```text
City
  Zone
    Locality
      MicroLocality
        Building
```

Example:

```text
Hyderabad
  West Hyderabad
    Gachibowli
      Telecom Nagar
        My Home Bhooja
```

## Core Tables

`User`
: Stores hashed contact identifiers, role, OTP verification state, and relations to submissions, votes, reports, devices, reputation, and audit logs.

`City`, `Zone`, `Locality`, `MicroLocality`, `Building`
: Store normalized geographic hierarchy, aliases, coordinates, and locality/building metadata.

`BuildingAlias`
: Supports search normalization for nickname variants like `MyHome`, `My Home`, `Bhooja`, and `My Home Bhooja`.

`RentSubmission`
: The main evidence table. It stores BHK, area, furnishing, parking, maintenance, deposit, move-in date, lease duration, floor, facing, building age, gated society status, pet friendliness, occupancy type, metro proximity, amenities snapshot, broker involvement, rent amount, effective monthly cost, rent type, source type, verification state, trust score, anomaly score, freshness score, and community agreement score.

## Trust and Verification Tables

`VerificationLog`
: Immutable event trail for OTP checks, proof checks, community confirmations, proof redaction, and score adjustments.

`TrustScore`
: Versioned trust score snapshots with factor breakdowns. This makes model changes auditable.

`UserReputation`
: Aggregates user reliability from accepted submissions, disputes, moderation helpfulness, and historical consistency.

`SubmissionVote`
: Reputation-weighted community validation inspired by Reddit, StackOverflow, and Wikipedia review systems.

## Moderation and Fraud Tables

`ModerationEvent`
: Records open review events, actions, reasons, metadata, status, and resolution time.

`AnomalyFlag`
: Stores statistical anomalies including Z-score, IQR outlier status, MAD outlier status, cluster key, severity, and explanation.

`DeviceFingerprint`
: Stores hashed device, IP, and user agent fingerprints with risk scores.

`FraudSignal`
: Stores suspicious activity signals such as rate limit hits, duplicate devices, rent spikes, IP clusters, broker patterns, coordinated spam, and proof mismatches.

`AuditLog`
: Stores internal changes for accountability.

## Analytics Tables

`HistoricalRentSnapshot`
: Stores monthly rent distribution snapshots by locality, optional building, and optional BHK.

`TrendAggregate`
: Stores generated trend rows for charts and programmatic SEO pages.

## Privacy Rules

The schema is built so public pages never need tenant identity, proof files, payment documents, flat numbers, or personal details. Proofs should be stored in private Supabase storage with encrypted object keys and redaction status.

## Migration

The initial migration is in `prisma/migrations/0001_initial/migration.sql`.

Run:

```bash
npm run db:migrate
npm run db:seed
```
