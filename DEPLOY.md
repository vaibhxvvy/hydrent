# HydRent Deployment Guide

Complete step-by-step instructions to deploy HydRent from your GitHub repo to Vercel with Supabase.

---

## Prerequisites

- GitHub account (repo already pushed)
- Vercel account (free tier)
- Supabase account (free tier)

---

## Step 1: Create Supabase Project (Database)

This gives you a free PostgreSQL database.

1. Go to https://supabase.com and log in.
2. Click **New Project**.
3. Choose an organization (or create one).
4. Enter project details:
   - Name: `hydrent-db`
   - Database Password: (enter a strong password)
   - Region: Choose > **Asia Pacific (Mumbai)** for lowest latency in India, or closest to your users.
5. Click **Create new project** and wait (~1-2 minutes).

6. Once created, go to **Project Settings** (gear icon at bottom left).

7. Click **Database** in the left sidebar.

8. Find the **Connection string** section. Copy the **URI** format.
   It looks like this:
   ```
   postgresql://postgres:[password]@db.xxxxxx.supabase.co:5432/postgres?schema=public
   ```

9. Also copy your **Project URL** (e.g., `https://xxxxxx.supabase.co`) and keep this page open.

10. Go to **Project Settings > API**. Copy:
    - **Project URL** (e.g., `https://xxxxxx.supabase.co`)
    - **anon public** key (looks like a long string)
    - **service_role secret** key (click reveal)

---

## Step 2: Set Up Database Locally

Open your terminal inside the project folder and run:

```bash
# 1. Install dependencies
npm install

# 2. Create your local .env from the example
cp .env.example .env
```

Now edit the `.env` file in any text editor. Replace the values:

```bash
# Required: Supabase Connection (paste the URI from Step 1, point 8)
DATABASE_URL="your-supabase-connection-string-here"
DIRECT_URL="your-supabase-connection-string-here"

# Required: Your app URL (use localhost for dev, change after Vercel deploy)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Required: Supabase project URL
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"

# Required: Supabase anon key (from API settings)
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

# Required: Supabase service role key (from API settings -> service_role)
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Optional: PostHog analytics (can leave blank for now)
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# Optional: Sentry error tracking (can leave blank for now)
SENTRY_DSN=""

# Required: Change this in production to a random string!
RATE_LIMIT_SECRET="hydrent-dev-secret-change-me-123"
```

**Save the file.**

Now run the database setup:

```bash
# Generate the Prisma client
npm run db:generate

# Push the schema to Supabase (creates all tables)
npx prisma migrate deploy

# Seed the database with Hyderabad data
npm run db:seed
```

If everything works, you will see output like "Created X localities, Y buildings, Z submissions."

---

## Step 3: Deploy to Vercel

1. Go to https://vercel.com and log in with your **GitHub account**.
2. Click **Add New Project** (big button on dashboard).
3. In **Import Git Repository**, find your `hydrent` repository and click **Import**.
4. On the **Configure Project** page:
   - Framework Preset: should auto-detect **Next.js**
   - Build Command: should auto-detect `prisma generate && next build`
   - Output Directory: leave default
   - **Root Directory:** leave default (`.`)

5. **IMPORTANT — Add Environment Variables:**
   Scroll down to **Environment Variables** and add each variable from your `.env` file one by one:

   | Key | Value (paste exactly from your `.env`) |
   |-----|----------------------------------------|
   | `DATABASE_URL` | `your-supabase-connection-string` |
   | `DIRECT_URL` | `same as above` |
   | `NEXT_PUBLIC_APP_URL` | `https://hydrent-yourname.vercel.app` (or your Vercel URL) |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` |
   | `RATE_LIMIT_SECRET` | `change-me-in-production` |

6. Click **Deploy**.
   - Vercel will build the project (~1-3 minutes).
   - If the build fails, click the error log and check the message — usually a missing environment variable or database connection issue.

7. Once deployed, click **Continue to Dashboard**.
   - Your site is live at `https://hydrent-[yourname].vercel.app`

---

## Step 4: Verify Deployment

Click each URL below (replace with your actual domain):

| URL | Expected Result |
|-----|-----------------|
| `https://hydrent-yourname.vercel.app/` | Homepage with Hyderabad rent overview |
| `https://hydrent-yourname.vercel.app/api/health` | `{ "ok": true }` |
| `https://hydrent-yourname.vercel.app/sitemap.xml` | XML sitemap |
| `https://hydrent-yourname.vercel.app/robots.txt` | Robots file |
| `https://hydrent-yourname.vercel.app/hyderabad/gachibowli` | Locality report with real data |
| `https://hydrent-yourname.vercel.app/building/prestige-high-fields` | Building page |
| `https://hydrent-yourname.vercel.app/compare/gachibowli-vs-kondapur` | Comparison page |

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Build fails with "DATABASE_URL not found" | Add env vars in Vercel project settings and redeploy |
| "Connection refused" to database | Make sure `DATABASE_URL` uses port `5432` not `6543` for Prisma |
| Seed script fails | Ensure `DATABASE_URL` and `DIRECT_URL` are both set in `.env` |
| OpenStreetMap map is blank | Tiles load client-side; check browser dev tools for blocked requests |
| Admin page is public | Add auth (NextAuth/Clerk) for production (optional for demo) |

---

## Continuous Deployment (Auto-Update)

Once Vercel is linked to your GitHub repo, every `git push` auto-deploys:

```bash
git add .
git commit -m "your update message"
git push origin main
# Vercel auto-deploys from GitHub
```

---

## Quick Commands Reference

```bash
# Local development
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