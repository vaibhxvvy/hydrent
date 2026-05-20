# Supabase Setup Guide for HydRent

This guide helps you connect your HydRent project to Supabase for authentication, data storage, and real-time features.

---

## Step 1: Install Packages

The packages have already been installed:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## Step 2: Create Supabase Project

1. Go to https://supabase.com and log in.
2. Click **New Project**.
3. Choose your organization.
4. Enter:
   - **Name**: `hydrent`
   - **Database Password**: (create a strong password)
   - **Region**: Choose closest to your users (e.g., Mumbai for India)
5. Click **Create new project** and wait for it to initialize.

---

## Step 3: Get Your Project Credentials

### Project URL & API Keys

1. In your Supabase project dashboard, go to **Project Settings** (gear icon, bottom left).
2. Click **API** in the left sidebar.
3. Copy these values:
   - **Project URL** (e.g., `https://xxxxxx.supabase.co`)
   - **anon public** key (long string under "anon public")
   - **service_role secret** key (under "service_role key", click Reveal)

### Database Connection String

1. Go to **Project Settings > Database**.
2. Find the **Connection string** section.
3. Copy the **URI** format string.
   - It looks like: `postgresql://postgres:[password]@db.xxxxxx.supabase.co:5432/postgres`

---

## Step 4: Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Connection
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database (use the Connection URI from Step 3)
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?schema=public"

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Optional error tracking
SENTRY_DSN=

# Security (change in production)
RATE_LIMIT_SECRET=hydrent-dev-secret-change-me-123
```

**Replace the placeholder values with your actual Supabase credentials.**

---

## Step 5: Apply Prisma Schema to Supabase

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase (creates all tables)
npx prisma migrate deploy

# Seed the database with Hyderabad data
npm run db:seed
```

---

## Step 6: Update Existing Supabase Client Files

### Option A: Migrate to `@supabase/ssr` (Recommended)

The new `@supabase/ssr` package is already set up in `src/utils/supabase/`. This provides better cookie-based session handling for Next.js App Router.

### Option B: Keep Current Setup

If the existing `src/lib/supabase.ts` works for your needs, you can keep it as-is. The `@supabase/ssr` setup is additive.

---

## Files Created

### `src/utils/supabase/server.ts`

Creates a Supabase client for Server Components:

```typescript
import { createClient } from "@/utils/supabase/server";

// Use in Server Components
const supabase = createClient(cookieStore);
const { data } = await supabase.from("rent_submissions").select();
```

### `src/utils/supabase/client.ts`

Creates a Supabase client for Client Components:

```typescript
import { createClient } from "@/utils/supabase/client";

// Use in Client Components
const supabase = createClient();
const { data } = await supabase.from("rent_submissions").select();
```

### `src/utils/supabase/middleware.ts`

Middleware for refreshing sessions:

```typescript
import { createClient } from "@/utils/supabase/middleware";

// Use in Next.js middleware
export async function middleware(request: NextRequest) {
  return createClient(request);
}
```

---

## Step 7: Enable Auth (Optional)

If you want to add authentication:

1. In Supabase Dashboard, go to **Authentication > Providers**.
2. Enable the providers you want (e.g., Email, Google, GitHub).
3. Configure callback URLs in **Authentication > URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`

For production, update these to your Vercel domain.

---

## Step 8: Deploy to Vercel

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "feat: add Supabase integration"
   git push origin main
   ```

2. Go to https://vercel.com and import your repository.

3. Add all environment variables from `.env.local` to Vercel:
   
   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` |
   | `DATABASE_URL` | `your-connection-string` |
   | `DIRECT_URL` | `your-connection-string` |
   | `RATE_LIMIT_SECRET` | `change-me-in-production` |

4. Click **Deploy**.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module '@supabase/ssr'" | Run `npm install` |
| Build fails with "Missing env var" | Add env vars in Vercel dashboard |
| Database connection refused | Check that `DATABASE_URL` uses correct password and host |
| Auth not working | Check that redirect URLs are configured in Supabase |
| Cookies not persisting | Use `@supabase/ssr` and ensure middleware is set up |

---

## Next Steps

1. Set up Row Level Security (RLS) policies in Supabase.
2. Add Google OAuth for easy sign-in.
3. Enable Realtime for live rent updates.
4. Set up Storage for proof uploads.
5. Configure Webhooks for moderation events.
