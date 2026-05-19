# Verification Engine

The verification engine turns raw submissions into weighted evidence. It is designed to be explainable and auditable.

## Pipeline

1. Receive submission.
2. Validate payload with Zod.
3. Rate limit by IP/device key.
4. Normalize locality, micro-locality, building, and aliases.
5. Calculate statistical anomaly score.
6. Calculate trust score.
7. Decide publishing delay.
8. Create verification logs.
9. Queue moderation if needed.
10. Recompute locality and building aggregates.

## Verification States

`SEED_ESTIMATE`
: Imported or manually entered estimate, clearly labeled.

`PENDING_REVIEW`
: New submission awaiting basic checks.

`COMMUNITY_REVIEW`
: Visible to moderators or reputation-weighted reviewers but not strongly weighted.

`VERIFIED`
: Sufficient evidence, consensus, or proof checks.

`DISPUTED`
: Conflicting signals or credible report.

`REJECTED`
: Removed from aggregate influence.

## Proof Handling

Proof upload is optional but valuable. Production proof handling should:

- Store files in private Supabase Storage.
- Encrypt object references.
- Run OCR redaction with Tesseract.js or a local redaction workflow.
- Remove names, phone numbers, payment IDs, flat numbers, and agreement identifiers.
- Store redaction status, not public proof data.

## Auditability

Every score change should create a `VerificationLog`. Trust score recalculations should create a `TrustScore` row with factor breakdown JSON. Moderation decisions should create `ModerationEvent` rows.

## Open-Source Principle

HydRent users should be able to understand why a rent range is trusted without seeing private evidence. This mirrors open-source review: public process, private sensitive material.
