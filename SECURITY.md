# Security Policy

HydRent handles sensitive housing data. Treat privacy bugs as security bugs.

## Sensitive Data

Never expose:

- Tenant identities.
- Flat numbers.
- Phone numbers.
- Rental agreements.
- Payment proofs.
- Uploaded verification files.
- Exact submission records tied to users.

## Reporting

Open a private security advisory or contact the maintainers before publishing details. Include reproduction steps, affected routes, and suggested mitigation if available.

## Production Hardening

- Protect `/admin` with server-side auth.
- Store proofs in private encrypted storage.
- Redact proof text before human review.
- Hash phone, email, IP, and device identifiers.
- Rate limit submissions.
- Audit moderation changes.
