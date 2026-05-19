# API Documentation

HydRent exposes a small API surface for search, rent submission, and health checks. Server actions are used for first-party forms.

## GET `/api/search`

Search localities and buildings with alias and fuzzy normalization.

Query:

```text
q=MyHome
```

Response:

```json
{
  "results": [
    {
      "type": "building",
      "title": "My Home Bhooja",
      "subtitle": "Raidurg - Knowledge City · Gachibowli",
      "href": "/building/my-home-bhooja",
      "score": 100
    }
  ]
}
```

## POST `/api/rent-submissions`

Accepts a rent submission and queues it for validation.

Request:

```json
{
  "localitySlug": "gachibowli",
  "microLocality": "Telecom Nagar",
  "bhk": "2BHK",
  "rentType": "CLOSED",
  "furnishing": "SEMI_FURNISHED",
  "occupancyType": "FAMILY",
  "rentAmount": 52000,
  "maintenanceAmount": 6000,
  "maintenanceIncluded": false,
  "securityDeposit": 150000,
  "moveInDate": "2026-04-01",
  "brokerInvolved": false,
  "gatedSociety": true,
  "petFriendly": false
}
```

Response:

```json
{
  "status": "queued",
  "verificationState": "PENDING_REVIEW",
  "trustScore": 54,
  "publication": "delayed_for_validation"
}
```

## GET `/api/health`

Returns service health.

```json
{
  "ok": true,
  "service": "hydrent",
  "timestamp": "2026-05-19T00:00:00.000Z"
}
```

## Validation

All inbound payloads are validated with Zod in `src/lib/validations`.

## Rate Limiting

The current implementation uses an in-memory rate limiter suitable for local development. Production should move rate limit state to PostgreSQL, Redis-compatible storage, or Supabase edge functions.
