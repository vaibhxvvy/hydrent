# Trust System

HydRent does not use a centralized "admin decides truth" model. Trust is computed from transparent factors, then improved through community validation and moderation events.

## Evidence Classes

1. Closed rent
   - Highest quality.
   - Represents an actual finalized lease or move-in amount.

2. Renewed rent
   - Strong evidence.
   - Useful for trend continuity but can be tenant-specific.

3. Asking rent
   - Lowest default weight.
   - Often influenced by listings, brokers, and negotiation anchoring.

## Trust Factors

Each submission can be scored using:

- OTP verification.
- Account age.
- Submission consistency.
- Private proof upload.
- Nearby consensus match.
- Historical user reliability.
- Community validation.
- Anomaly resistance.
- Rent type quality.

## Current Formula

The code in `src/lib/analytics/trust.ts` uses weighted factors:

- OTP verification: 14%
- Account age: 12%
- Submission consistency: 17%
- Proof upload: 14%
- Community agreement: 16%
- Historical reliability: 17%
- Anomaly resistance: 6%
- Rent type quality: 4%

The formula is intentionally simple and documented so it can be challenged, tested, and improved.

## Confidence vs Trust

Trust score is submission-level.

Confidence score is aggregate-level and depends on:

- Sample size.
- Verified ratio.
- Freshness.
- Variance.
- Weight health.

A highly trusted submission can exist inside a low-confidence locality if sample density is still weak.

## Community Validation

Community validation should be reputation-weighted:

- New accounts can vote, but with low weight.
- Established contributors with accepted submissions receive higher weight.
- Disputed or penalized users lose weight.
- Votes should store reason and timestamp.
- Vote brigading should create fraud signals.

## Publishing Policy

HydRent can delay publishing based on trust and anomaly risk:

- High trust and low anomaly: publish after basic validation.
- Medium trust: delay for community review.
- High anomaly: require proof or moderation review.
- Repeated suspicious behavior: reputation penalty and device/IP risk escalation.
