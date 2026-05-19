# HydRent Deployment Guide

Complete step-by-step instructions to create a new repository, push this codebase, and deploy it live.

---

## Prerequisites

- Node.js 20+ and npm installed
- Git installed
- A GitHub account
- A Vercel account (free tier)
- A Supabase account (free tier)

---

## Step 1: Create a New GitHub Repository & Push

### Option A: Quick One-Liner

```bash
# 1. Create a new repository on GitHub first (no README, .gitignore, or license).
# 2. Copy the repository URL (e.g., https://github.com/YOUR_USERNAME/hydrent.git).
# 3. Run these commands in the project folder:

git remote add origin https://github.com/YOUR_USERNAME/hydrent.git
git branch -M main
git push -u origin main
```

### Option B: Via GitHub CLI

```bash
# Install gh if you haven't already
# https://cli.github.com/

# Authenticate with GitHub
git login

# Create a new private repository on your account and push
git repo create hydrent --private --source=. --push
```

---

## Step 2: Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your real credentials:

```bash
# Required for Prisma + Supabase
DATABASE_URL="postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres?schema=public"

# App URL (change after Vercel deploy)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase (optional for auth/storage)
NEXT_PUBLIC_SUPABASE_URL="https://[project-id].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[your-service-role-key]"

# Optional: PostHog analytics
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# Optional: Sentry error tracking
SENTRY_DSN=""

# Required: Change this in production!
RATE_LIMIT_SECRET="change-me-in-production"
```

---

## Step 3: Set Up Supabase (PostgreSQL Database)

1. Go to https://supabase.com/ and create a new project.
2. In Project Settings > Database, copy the **Connection string** (URI).
3. Paste it into `DATABASE_URL` and `DIRECT_URL` in your `.env`.
4. Run migrations:

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates all tables)
npx prisma migrate deploy

# Seed the database with Hyderabad data
npm run db:seed
```

The seed script will populate:
- Hyderabad city record
- Zones (West Hyderabad, Central Hyderabad, etc.)
- Localities (Gachibowli, Kondapur, Madhapur, etc.)
- Buildings / Societies (My Home Bhooja, Prestige High Fields, etc.)
- Rent submissions with realistic data
- Building aliases for search normalization

---

## Step 4: Deploy to Vercel

### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel

# Follow the prompts to link to your GitHub repo.
# Choose your GitHub repository when prompted.
```

### Option B: Vercel Dashboard (Web)

1. Go to https://vercel.com/new and import your GitHub repository.
2. Vercel will auto-detect Next.js.
3. Add these **Environment Variables** in the Vercel dashboard:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase connection string |
| `DIRECT_URL` | Same as DATABASE_URL |
| `NEXT_PUBLIC_APP_URL` | Your Vercel domain (e.g., `https://hydrent.vercel.app`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `RATE_LIMIT_SECRET` | A secure random string |

4. Click **Deploy**.

---

## Step 5: Post-Deployment Verification

After deployment, verify these URLs work:

| URL | Expected Result |
|-----|-----------------|
| `https://your-domain.com/` | Homepage with rent overview |
| `https://your-domain.com/api/health` | `{ "ok": true }` |
| `https://your-domain.com/sitemap.xml` | XML sitemap for SEO |
| `https://your-domain.com/robots.txt` | Robots file |
| `https://your-domain.com/hyderabad/gachibowli` | Locality report with data |
| `https://your-domain.com/building/prestige-high-fields` | Building page |
| `https://your-domain.com/compare/gachibowli-vs-kondapur` | Comparison page |

---

## Step 6: Continuous Deployment (Auto-Deploy on Push)

Once linked, every `git push` to `main` will auto-deploy:

```bash
# Make any change, then:
git add .
git commit -m "feat: update XYZ"
git push origin main
# Vercel auto-deploys from GitHub
```

---

## Troubleshooting

### Build Fails
```bash
# 1. Verify TypeScript compiles
npm run typecheck

# 2. Verify build locally
npm run build

# 3. Check Prisma schema
npx prisma validate
```

### Database Connection Error
- Verify `DATABASE_URL` uses the **Transaction pooler** port (5432) or **Session pooler** port (6543).
- Ensure your Supabase project is active (not paused).
- Check IP allowlist in Supabase Dashboard > Database > IPv4.

### Map Tiles Not Loading
- OpenStreetMap tiles are free but have usage limits.
- For production, consider self-hosting tile server or using free Mapbox tier.

---

## Optional: Production Hardening

1. **Enable NextAuth or Clerk** for admin route protection.
2. **Add Sentry DSN** for error tracking.
3. **Configure PostHog** for product analytics.
4. **Set up a cron job** (Vercel Cron) to recalculate trend aggregates daily.
5. **Enable row-level security** in Supabase before accepting public submissions.

---

## Quick Reference Commands

```bash
# Local development
npm install
npm run dev

# Type check
npm run typecheck

# Format code
npm run format

# Database
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed data

# Build
npm run build

# Lint
npm run lint
```

---

## Next Steps

After deployment:

1. **Submit your sitemap** to Google Search Console.
2. **Share the project** on LinkedIn, Reddit (r/hyderabad, r/india), and Twitter.
3. **Collect real rent data** from Hyderabad communities.
4. **Expand to other cities** by adding new City, Zone, and Locality records.
