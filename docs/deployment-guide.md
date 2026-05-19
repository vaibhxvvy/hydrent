# Deployment Guide

HydRent is optimized for free-tier deployment.

## Vercel

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Add environment variables from `.env.example`.
4. Connect Supabase PostgreSQL.
5. Run Prisma migrations from a local machine or CI job.
6. Deploy.

Build command:

```bash
npm run build
```

Output:

```text
Next.js application
```

## Supabase

1. Create a free Supabase project.
2. Copy connection strings into `DATABASE_URL` and `DIRECT_URL`.
3. Create a private storage bucket for proof files.
4. Configure row-level security before accepting production submissions.

## Production Checklist

- Set non-placeholder `RATE_LIMIT_SECRET`.
- Add auth for `/admin`.
- Enable Sentry DSN.
- Configure PostHog if analytics are needed.
- Review OpenStreetMap tile usage.
- Run `npm run typecheck`.
- Run `npm run build`.
- Confirm `robots.txt` and `sitemap.xml`.

## Caching

- Public locality pages can use ISR.
- API search can be cached if connected to stable data.
- Submission routes should not be cached.
- Admin pages should require auth and avoid public caching.
