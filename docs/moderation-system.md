# Moderation System

Moderation is designed as a transparent review system rather than a hidden admin override.

## Moderation Sources

Moderation events can be created by:

- Statistical anomaly detection.
- Community reports.
- Duplicate building aliases.
- Device/IP fraud signals.
- Suspicious broker-like patterns.
- Stale data health checks.
- Manual moderator review.

## Queue Types

1. Anomaly review
   - High Z-score, IQR, or MAD outlier.
   - Rent spikes in a micro-locality.

2. Duplicate merge
   - Building alias variants.
   - Misspellings and nicknames.

3. Proof request
   - High-impact data with weak reputation.
   - Asking rent that claims to be closed rent.

4. Locality health
   - Low sample density.
   - Stale data.
   - High variance.

5. Fraud cluster
   - Repeated device.
   - Rate limit hits.
   - Coordinated rent inflation.

## Admin Dashboard

The current `/admin` route provides a TanStack Table foundation with:

- Queue item.
- Locality.
- Risk level.
- Anomaly score.
- Suggested action.

Production expansion should add role-based auth, event detail pages, evidence previews, merge tools, and audit export.

## Decision Principles

- Prefer reversible decisions.
- Preserve audit logs.
- Reduce weight before deleting data.
- Explain moderation status.
- Never expose private proof material publicly.
- Make aggregate confidence respond to disputes.
