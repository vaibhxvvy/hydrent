# Onboarding Guide

HydRent includes a first-run onboarding panel that explains:

- Confidence scores.
- Community moderation.
- Robust statistics.
- Privacy-first proof handling.

The component lives in:

```text
src/components/onboarding/onboarding-tour.tsx
```

State is stored with Zustand in:

```text
src/components/onboarding/onboarding-store.ts
```

The user dismissal is persisted in local storage.

## Product Goal

Renters should understand that HydRent is not showing listing prices. It is showing trust-weighted ranges derived from real rent evidence and community validation.

## Future Improvements

- Add contextual inline explanations for confidence meters.
- Add route-specific onboarding for first locality page visit.
- Add contribution incentives after users read methodology.
- Add accessibility review for focus trapping if onboarding becomes modal.
