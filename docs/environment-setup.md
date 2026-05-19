# Environment Setup

Copy the example file:

```bash
cp .env.example .env
```

## Required for Database Work

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hydrent?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/hydrent?schema=public"
```

`DATABASE_URL` is used by Prisma. `DIRECT_URL` is useful for Supabase direct migration access.

## Optional Supabase

```env
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
```

Use Supabase Storage for private proof uploads. Do not expose service role keys to the browser.

## Optional Analytics

```env
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

## Optional Monitoring

```env
SENTRY_DSN=""
```

The repository includes structured logging and Sentry-ready dependency wiring.

## Maps

```env
NEXT_PUBLIC_MAP_TILE_URL="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
```

For production traffic, use a tile policy-compliant provider or cache.
