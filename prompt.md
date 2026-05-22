# HydRent — Full UI/UX Upgrade + Bug Fix Prompt
### For Zero (zerolang.com) / Open Code — Copy this entire prompt verbatim

---

## CONTEXT

You are working on **HydRent** (https://hydrent.vercel.app), a Next.js 14 App Router civic-tech project
that shows community-verified rent data for Hyderabad. The stack is:
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel
- **Repo**: open source (GitHub)

The site has 25 localities with ~1,000 seed submissions, working pages at `/hyderabad/[locality]`,
`/compare/[a-vs-b]`, `/localities`, `/submit`, `/how-data-works`, `/issues`.

---

## MASTER OBJECTIVE

Execute ALL of the following microtasks in order. Do not skip any task. After every group of tasks,
verify the build compiles with no TypeScript errors and no broken imports before moving to the next group.
At the very end, deploy to Vercel.

The final result must be:
1. A visually stunning, production-grade UI that feels premium — not a generic template
2. Every known bug fixed (listed below in full)
3. Fully deployed and live on Vercel

---

## DESIGN SYSTEM TO IMPLEMENT

Before writing a single line of UI code, internalize this design language and apply it everywhere:

**Palette**
- Background primary: `#FAFAF8` (warm off-white)
- Background secondary: `#F3F2EE` (warm surface)
- Background dark: `#0D0F0E` (near-black green tint)
- Accent primary: `#1A6B4A` (deep teal-green — trust, verified)
- Accent secondary: `#E8593C` (coral-orange — CTAs, urgency)
- Text primary: `#1A1A18`
- Text secondary: `#6B6B63`
- Text tertiary: `#9C9B93`
- Border default: `rgba(26,26,24,0.1)`
- Border strong: `rgba(26,26,24,0.2)`
- Success: `#16A34A`, Warning: `#CA8A04`, Danger: `#DC2626`

**Typography** (via next/font/google)
- Display / headings: `Instrument Serif` (italic for hero numbers)
- Body / UI: `Inter` (variable, 300–600 weights only)
- Monospace / stats: `JetBrains Mono` (for rent amounts, percentages)

**Motion**
- All interactive elements: `transition-all duration-200 ease-out`
- Page transitions: `opacity 0 → 1` over 300ms on mount
- Skeleton loaders on all async data
- Hover on cards: `translateY(-2px)` with shadow lift

**Component rules**
- Cards: `rounded-2xl border border-border bg-white shadow-sm hover:shadow-md transition`
- Buttons primary: `bg-accent-primary text-white rounded-full px-6 py-3 font-medium hover:bg-accent-primary/90`
- Buttons secondary: `border border-border rounded-full px-6 py-3 hover:bg-secondary`
- Badges: `rounded-full text-xs font-medium px-2.5 py-1`
- Trust score pill: green if >70, amber if 50–70, red if <50
- All rent amounts must use `font-mono` and `₹` prefix
- All confidence scores display as coloured pill badges, never plain text

---

## MICROTASK GROUP 1 — CRITICAL BUG FIXES (do these first, in order)

### MICROTASK 1.1 — Fix localhost canonical URL (HIGHEST PRIORITY)

**Problem**: Every page sends `canonical: http://localhost:3000` and `og:url: http://localhost:3000`
to crawlers. This is destroying SEO and breaking social sharing previews.

**Steps**:
1. Open `.env.local` (create if missing). Add:
   ```
   NEXT_PUBLIC_SITE_URL=https://hydrent.vercel.app
   ```
2. In Vercel dashboard environment variables, also set `NEXT_PUBLIC_SITE_URL=https://hydrent.vercel.app`
   for Production, Preview, and Development.
3. Create `/lib/siteConfig.ts`:
   ```typescript
   export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hydrent.vercel.app'
   export const SITE_NAME = 'HydRent'
   export const SITE_DESCRIPTION = 'Community-verified Hyderabad rent intelligence based on real rents people pay, not inflated listing prices.'
   ```
4. Create `/lib/metadata.ts`:
   ```typescript
   import { Metadata } from 'next'
   import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from './siteConfig'

   export function buildMetadata({
     title,
     description,
     path,
     ogImage,
   }: {
     title?: string
     description?: string
     path: string
     ogImage?: string
   }): Metadata {
     const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Real Hyderabad rent intelligence`
     const fullDescription = description ?? SITE_DESCRIPTION
     const url = `${SITE_URL}${path}`
     const image = ogImage ?? `${SITE_URL}/og-image.png`

     return {
       title: fullTitle,
       description: fullDescription,
       metadataBase: new URL(SITE_URL),
       alternates: { canonical: url },
       openGraph: {
         title: fullTitle,
         description: fullDescription,
         url,
         siteName: SITE_NAME,
         images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
         type: 'website',
       },
       twitter: {
         card: 'summary_large_image',
         title: fullTitle,
         description: fullDescription,
         images: [image],
       },
     }
   }
   ```
5. Replace ALL existing `export const metadata` or `generateMetadata` calls across every page file
   to use `buildMetadata()`. Search codebase for the string "localhost" — it must appear zero times
   after this change (except in comments and .env.example).
6. Verify: run `grep -r "localhost" app/ lib/ --include="*.ts" --include="*.tsx"` → should return nothing.

---

### MICROTASK 1.2 — Fix the dual navbar (consolidate into one component)

**Problem**: Two different nav components exist. The homepage nav links to broken routes
(`/hyderabad/gachibowli`, `/compare/gachibowli-vs-kondapur`). The /localities nav uses correct routes.

**Steps**:
1. Delete any secondary nav component (look for duplicate in `components/` — anything like
   `NavHome`, `NavLegacy`, or a nav that hardcodes gachibowli/kondapur).
2. Create `/components/Nav.tsx` as the single authoritative nav:
   ```tsx
   'use client'
   import Link from 'next/link'
   import { usePathname } from 'next/navigation'
   import { useState } from 'react'

   const links = [
     { href: '/localities', label: 'Localities' },
     { href: '/compare', label: 'Compare' },
     { href: '/how-data-works', label: 'How it works' },
   ]

   export function Nav() {
     const pathname = usePathname()
     const [menuOpen, setMenuOpen] = useState(false)

     return (
       <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
         <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
           <Link href="/" className="font-display text-lg font-semibold text-primary">
             HydRent
           </Link>
           {/* Desktop links */}
           <div className="hidden md:flex items-center gap-1">
             {links.map(l => (
               <Link
                 key={l.href}
                 href={l.href}
                 className={`px-4 py-2 rounded-full text-sm transition-colors ${
                   pathname.startsWith(l.href)
                     ? 'bg-secondary text-primary font-medium'
                     : 'text-secondary hover:text-primary hover:bg-secondary/50'
                 }`}
               >
                 {l.label}
               </Link>
             ))}
           </div>
           <Link
             href="/submit"
             className="bg-accent-primary text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-accent-primary/90 transition-colors"
           >
             Submit rent
           </Link>
         </div>
       </nav>
     )
   }
   ```
3. Update `app/layout.tsx` to import and use only `<Nav />`. Remove all other nav imports.
4. Remove the old duplicate nav component files.

---

### MICROTASK 1.3 — Fix blank locality pages (gachibowli, kondapur, madhapur etc.)

**Problem**: `/hyderabad/gachibowli` and several other homepage-linked pages render a blank shell
because the seed data doesn't include entries for those slugs, or the slug lookup fails silently.

**Steps**:
1. Open your Supabase database. Run this query to check which locality slugs exist:
   ```sql
   SELECT DISTINCT locality_slug, COUNT(*) as count
   FROM submissions
   GROUP BY locality_slug
   ORDER BY count DESC;
   ```
2. In your `app/hyderabad/[locality]/page.tsx`, find the data-fetching function (likely
   `getLocalityData(slug)` or similar Supabase call). Add robust error handling:
   ```typescript
   const data = await getLocalityData(params.locality)
   if (!data || data.submissionCount === 0) {
     // Don't render blank — render a proper empty state
     return <LocalityEmptyState locality={params.locality} />
   }
   ```
3. Create `/components/LocalityEmptyState.tsx`:
   ```tsx
   export function LocalityEmptyState({ locality }: { locality: string }) {
     const name = locality.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
     return (
       <main className="max-w-2xl mx-auto px-4 py-20 text-center">
         <div className="text-6xl mb-4">📍</div>
         <h1 className="text-2xl font-display font-semibold mb-3">
           No data yet for {name}
         </h1>
         <p className="text-secondary mb-8">
           Be the first renter to submit a verified rent for {name}.
           It takes 90 seconds and helps hundreds of future renters.
         </p>
         <Link href="/submit" className="btn-primary">Submit rent for {name}</Link>
       </main>
     )
   }
   ```
4. If gachibowli/kondapur/madhapur genuinely have no seed data, insert seed rows for them
   in Supabase so the homepage featured cards work. Use approximate market-rate values.
5. Update the homepage featured cards to ONLY link to localities confirmed to have data.
   Add a runtime check: if a locality's `submissionCount === 0`, don't render its card on homepage.

---

### MICROTASK 1.4 — Fix the "₹0 median" auto-generated paragraph on locality pages

**Problem**: Every locality page generates: "Bachupally currently shows a trust-weighted median
effective monthly cost of ₹0. The central range sits between ₹0 and ₹0, with 0% of the local
sample verified."

**Steps**:
1. Find the function that generates this paragraph (search for "currently shows a trust-weighted"
   in the codebase). It's likely in `app/hyderabad/[locality]/page.tsx` or a helper.
2. The bug: the paragraph template is reading from a different data variable than the stats widget.
   Identify which object holds the real stats (the one showing ₹20,387 in the widget) and make
   the paragraph read from THAT same object.
3. Add guards: if `median === 0 || median === null || median === undefined`, do not render the
   paragraph at all. Return `null` for that component.
4. Fix the template to produce properly formatted output:
   ```typescript
   function generateLocalityDescription(stats: LocalityStats, localityName: string): string | null {
     if (!stats.median || stats.median === 0) return null
     return `${localityName} shows a trust-weighted median rent of ₹${stats.median.toLocaleString('en-IN')}. ` +
       `The central range is ₹${stats.p25.toLocaleString('en-IN')} – ₹${stats.p75.toLocaleString('en-IN')}, ` +
       `based on ${stats.submissionCount} community-verified submissions.`
   }
   ```

---

### MICROTASK 1.5 — Fix the raw timestamp dump at the bottom of locality pages

**Problem**: The bottom of every working locality page dumps raw relative timestamps:
"6d ago 9d ago 9d ago 9d ago 9d ago 10d ago..." with no structure or labels.

**Steps**:
1. Find the component responsible — search for a `.map()` over submissions that outputs only
   the `created_at` or `timeAgo` field without the full submission object.
2. The fix: either (a) pass the full submission object to the component, or (b) delete the
   raw dump entirely if the formatted "Recent verified rents" section in the middle of the page
   already covers this.
3. If keeping a recent activity section, use this component pattern:
   ```tsx
   function RecentRentItem({ item }: { item: Submission }) {
     return (
       <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
         <div className="flex items-center gap-3">
           <span className="bg-secondary rounded-lg px-2.5 py-1 text-sm font-mono font-medium">
             {item.bhk}BHK
           </span>
           <span className="font-mono font-semibold">₹{item.rent.toLocaleString('en-IN')}</span>
           <span className="text-secondary text-sm capitalize">{item.furnishing}</span>
         </div>
         <div className="flex items-center gap-2">
           <span className={`badge ${item.rentType === 'closed' ? 'badge-green' : 'badge-gray'}`}>
             {item.rentType === 'closed' ? 'Closed deal' : item.rentType === 'renewal' ? 'Renewal' : 'Asking'}
           </span>
           <span className="text-tertiary text-sm">{timeAgo(item.createdAt)}</span>
         </div>
       </div>
     )
   }
   ```
4. Remove the raw dump. If the component is in a Server Component and you can't easily identify it,
   add `{false && <RawDumpComponent />}` as a quick kill switch, then refactor properly.

---

### MICROTASK 1.6 — Fix submit form: add loading, success, and error states

**Problem**: The submit form has no feedback. Users don't know if their submission worked.

**Steps**:
1. Convert `app/submit/page.tsx` to a client component with full state management:
   ```typescript
   type FormState = 'idle' | 'loading' | 'success' | 'error'
   const [state, setState] = useState<FormState>('idle')
   const [errorMessage, setErrorMessage] = useState('')
   ```
2. Wrap the Supabase insert in try/catch:
   ```typescript
   async function handleSubmit(formData: FormData) {
     setState('loading')
     try {
       const { error } = await supabase.from('submissions').insert({...})
       if (error) throw error
       setState('success')
     } catch (err: any) {
       setErrorMessage(err.message ?? 'Something went wrong. Please try again.')
       setState('error')
     }
   }
   ```
3. Loading state: disable button, show spinner inside button, add `opacity-50 cursor-not-allowed`
   to all inputs.
4. Success state: replace form with:
   ```tsx
   <div className="text-center py-12">
     <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
       <CheckIcon className="w-8 h-8 text-green-600" />
     </div>
     <h2 className="text-2xl font-display font-semibold mb-2">Rent submitted!</h2>
     <p className="text-secondary mb-6">
       Your signal is in the verification queue. It helps hundreds of Hyderabad renters negotiate fairly.
     </p>
     <div className="flex gap-3 justify-center">
       <button onClick={() => setState('idle')} className="btn-secondary">Submit another</button>
       <Link href="/localities" className="btn-primary">See locality data →</Link>
     </div>
   </div>
   ```
5. Error state: show error banner above the form with the message. Allow retry without refreshing.
6. Add client-side validation before submission:
   - `rent`: required, number, between 3000 and 300000
   - `locality`: required, must be a valid slug from the localities list
   - `bhk`: required, must be 1/2/3/4/5
   - `rentType`: required
   - `moveInDate`: required, must be in the past (≤ today)
   - Show inline red error messages under each invalid field on blur
7. The "Effective monthly cost" field must auto-calculate: `rent + (maintenanceIncluded ? 0 : maintenance)`.
   Wire an `onChange` handler to the rent and maintenance inputs to recompute this in real time.

---

### MICROTASK 1.7 — Fix /issues form (wire to actual submission endpoint)

**Problem**: The /issues form appears to do nothing — no endpoint, no feedback.

**Steps**:
1. Create `app/api/report-issue/route.ts`:
   ```typescript
   import { NextRequest, NextResponse } from 'next/server'
   import { createClient } from '@/lib/supabase/server'

   export async function POST(req: NextRequest) {
     const body = await req.json()
     const { name, email, subject, message } = body

     if (!email || !subject || !message) {
       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
     }

     const supabase = createClient()
     const { error } = await supabase.from('issue_reports').insert({
       name, email, subject, message, created_at: new Date().toISOString()
     })

     if (error) {
       // Fallback: at minimum log it
       console.error('Issue report error:', error)
       return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
     }

     return NextResponse.json({ success: true })
   }
   ```
2. Create an `issue_reports` table in Supabase if it doesn't exist:
   ```sql
   CREATE TABLE issue_reports (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     name text,
     email text NOT NULL,
     subject text NOT NULL,
     message text NOT NULL,
     created_at timestamptz DEFAULT now()
   );
   ```
3. Add loading/success/error states to the /issues form (same pattern as MICROTASK 1.6).
4. Remove the `mailto:labusepc@gmail.com` link from the footer — the form now handles this.

---

### MICROTASK 1.8 — Fix homepage city signal stats (connect to real data)

**Problem**: Homepage shows hardcoded ₹47,000, P25 ₹37,700, P75 ₹68,200, "6 verified signals",
"6 indexed localities" — all static seed values. The real database has 1,000 submissions.

**Steps**:
1. Create `lib/getCityStats.ts`:
   ```typescript
   import { createClient } from './supabase/server'
   import { cache } from 'react'

   export const getCityStats = cache(async () => {
     const supabase = createClient()
     const { data, error } = await supabase
       .from('submissions')
       .select('effective_monthly_cost, locality_slug, rent_type, created_at')

     if (error || !data || data.length === 0) return null

     const costs = data.map(d => d.effective_monthly_cost).sort((a, b) => a - b)
     const n = costs.length
     const median = costs[Math.floor(n / 2)]
     const p25 = costs[Math.floor(n * 0.25)]
     const p75 = costs[Math.floor(n * 0.75)]
     const closedShare = data.filter(d => d.rent_type === 'closed').length / n

     const uniqueLocalities = new Set(data.map(d => d.locality_slug)).size

     return {
       median: Math.round(median),
       p25: Math.round(p25),
       p75: Math.round(p75),
       submissionCount: n,
       localityCount: uniqueLocalities,
       closedShare: Math.round(closedShare * 100),
     }
   })
   ```
2. In `app/page.tsx`, call `getCityStats()` and pass the result to the hero stats section.
3. Replace every hardcoded stat on the homepage with the computed value. Add `toLocaleString('en-IN')`
   for all currency values.
4. If `getCityStats()` returns null, show skeleton placeholders, not hardcoded values.

---

### MICROTASK 1.9 — Fix compare page: wire the dropdown to navigate

**Problem**: The /compare page has two dropdowns and a button but likely does nothing on click.

**Steps**:
1. Make `/app/compare/page.tsx` a client component.
2. Add state: `const [a, setA] = useState('')` and `const [b, setB] = useState('')`
3. Populate dropdowns from the localities list (fetch from Supabase or use the static list).
4. Wire the Compare button:
   ```typescript
   function handleCompare() {
     if (!a || !b) return
     if (a === b) {
       alert('Please select two different localities')
       return
     }
     router.push(`/compare/${a}-vs-${b}`)
   }
   ```
5. Disable the button (`disabled={!a || !b}`) and show a tooltip when disabled.
6. Sort localities alphabetically in the dropdowns.
7. Pre-select Locality A from the user's last-visited locality if stored in `localStorage`.

---

## MICROTASK GROUP 2 — METADATA AND SEO FIXES

### MICROTASK 2.1 — Add correct metadata to all pages

Using the `buildMetadata()` function from MICROTASK 1.1, update every page:

**`app/page.tsx`** (homepage):
```typescript
export const metadata = buildMetadata({
  title: undefined, // uses default full title
  path: '/',
})
```

**`app/hyderabad/[locality]/page.tsx`** (locality pages):
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getLocalityData(params.locality)
  const name = slugToName(params.locality)
  if (!data || data.submissionCount === 0) {
    return buildMetadata({ title: `Rent in ${name}`, path: `/hyderabad/${params.locality}` })
  }
  return buildMetadata({
    title: `Rent in ${name}, Hyderabad`,
    description: `Trust-weighted median ₹${data.median.toLocaleString('en-IN')} based on ${data.submissionCount} verified submissions. P25 ₹${data.p25.toLocaleString('en-IN')} — P75 ₹${data.p75.toLocaleString('en-IN')}.`,
    path: `/hyderabad/${params.locality}`,
  })
}
```

**`app/compare/[comparison]/page.tsx`** (compare pages):
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [slugA, slugB] = params.comparison.split('-vs-')
  const nameA = slugToName(slugA), nameB = slugToName(slugB)
  return buildMetadata({
    title: `${nameA} vs ${nameB} rent comparison`,
    description: `Compare real rent data between ${nameA} and ${nameB} in Hyderabad. Trust-weighted medians, BHK breakdowns, P25/P75 bands.`,
    path: `/compare/${params.comparison}`,
  })
}
```

**`app/localities/page.tsx`**:
```typescript
export const metadata = buildMetadata({
  title: 'All Hyderabad localities',
  description: 'Browse rent intelligence for all 25+ Hyderabad localities. Trust-weighted medians, BHK breakdowns, verified submissions.',
  path: '/localities',
})
```

**`app/submit/page.tsx`**:
```typescript
export const metadata = buildMetadata({
  title: 'Submit your rent',
  description: 'Contribute a verified rent signal for Hyderabad. Anonymous. Takes 90 seconds. Helps hundreds of renters negotiate fairly.',
  path: '/submit',
})
```

**`app/how-data-works/page.tsx`**:
```typescript
export const metadata = buildMetadata({
  title: 'How data works',
  description: 'HydRent verification, trust scoring, moderation, privacy, and rent aggregation methodology.',
  path: '/how-data-works',
})
```

---

### MICROTASK 2.2 — Generate sitemap.xml

Create `app/sitemap.ts`:
```typescript
import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/siteConfig'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  const { data: localities } = await supabase
    .from('submissions')
    .select('locality_slug')
    .limit(1000)

  const uniqueSlugs = [...new Set((localities ?? []).map(l => l.locality_slug))]

  const localityUrls = uniqueSlugs.flatMap(slug => [
    { url: `${SITE_URL}/hyderabad/${slug}`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${SITE_URL}/hyderabad/${slug}/1bhk`, changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${SITE_URL}/hyderabad/${slug}/2bhk`, changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${SITE_URL}/hyderabad/${slug}/3bhk`, changeFrequency: 'weekly' as const, priority: 0.6 },
  ])

  // Generate all compare combinations
  const comparePairs: MetadataRoute.Sitemap = []
  for (let i = 0; i < uniqueSlugs.length; i++) {
    for (let j = i + 1; j < uniqueSlugs.length; j++) {
      comparePairs.push({
        url: `${SITE_URL}/compare/${uniqueSlugs[i]}-vs-${uniqueSlugs[j]}`,
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    }
  }

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/localities`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/compare`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/submit`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/how-data-works`, changeFrequency: 'monthly', priority: 0.5 },
    ...localityUrls,
    ...comparePairs,
  ]
}
```

Create `app/robots.ts`:
```typescript
import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/siteConfig'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/admin' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
```

---

## MICROTASK GROUP 3 — UI/UX REDESIGN (apply design system from top)

Apply all changes below using the design system defined at the top of this prompt.
Every component must look premium, not generic. Think: the best civic-tech product you've seen.

### MICROTASK 3.1 — Redesign the homepage hero

Replace the current homepage hero with this layout:

```
┌─────────────────────────────────────────────────────────┐
│  [Nav]                                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Small badge: "Hyderabad's rent truth layer"            │
│                                                         │
│  H1: "What your                                         │
│        neighbours                                       │
│        actually pay"      [City signal card]            │
│                           ┌───────────────────┐         │
│  Subtext: 1–2 sentences   │ Median ₹XX,XXX    │         │
│                           │ P25–P75 range     │         │
│  [Submit rent CTA]        │ XX localities     │         │
│  [See all localities]     │ XX submissions    │         │
│                           └───────────────────┘         │
│                                                         │
│  Social proof ticker: "X renters submitted this week"   │
└─────────────────────────────────────────────────────────┘
```

Implementation details:
- Hero background: `bg-background-primary` with subtle dot-grid pattern via CSS:
  `background-image: radial-gradient(circle, #d1d1ca 1px, transparent 1px); background-size: 24px 24px; opacity: 0.4`
- H1 font: `Instrument Serif`, 56px desktop / 36px mobile, line-height 1.05
- The word "actually" in H1 should be italic using `<em>` styled with `font-style: italic`
- City signal card: white card, `rounded-2xl shadow-sm border border-border`, shows live stats
- All numbers in city signal card use `font-mono` with smooth count-up animation on mount
  (use a simple `useEffect` with `requestAnimationFrame` to count from 0 to value over 800ms)
- CTA buttons: primary = "Submit your rent" (coral-orange), secondary = "Browse localities" (ghost)
- Below the fold: animated ticker showing "847 renters submitted this month" (use real count)

---

### MICROTASK 3.2 — Redesign the locality card grid on homepage

The 6 featured locality cards must be redesigned:
- Horizontal scroll on mobile, 3-column grid on desktop
- Each card: `rounded-2xl bg-white border border-border p-5 hover:-translate-y-1 transition-all duration-200`
- Card anatomy:
  ```
  ┌─────────────────────────────┐
  │ Gachibowli          [West]  │  ← locality name + zone badge
  │                             │
  │ ₹84,400                     │  ← median in font-mono, large
  │ ₹58,400 – ₹93,000           │  ← range in smaller mono
  │                             │
  │ ████████░░░░ 63/100 Medium  │  ← trust bar (coloured)
  │                             │
  │ HITEC City · Financial Dist │  ← nearby landmarks
  └─────────────────────────────┘
  ```
- Trust bar: a thin progress bar (`h-1 rounded-full`) in green/amber/red based on score
- Zone badge: `rounded-full text-xs bg-secondary text-secondary px-2 py-0.5`
- Replace broken locality cards with ones that actually have data

---

### MICROTASK 3.3 — Redesign /localities page

Full redesign of the locality list page:

1. **Header section**: "All Hyderabad localities" with count badge and last-updated timestamp
2. **Filter bar** (sticky below nav): 
   - Search input: "Search localities..." with magnifier icon
   - Zone filter pills: All | West | Central | North | South | East
   - Sort dropdown: "Sort by: Median ↓ | Trust score | Submission count"
   - These filters work client-side with no page reload
3. **Locality card grid**: 2-column on desktop, 1-column on mobile
   - Each card shows: name, zone, median, P25–P75 range, trust score pill, submission count, top BHK breakdown
   - BHK pills: `1BHK ₹X,XXX | 2BHK ₹XX,XXX | 3BHK ₹XX,XXX` in a row
   - Clicking a card navigates to `/hyderabad/[slug]`
4. **Empty state** for filter results: "No localities match your search" with clear button
5. **Trust score pills**: 
   - >70: `bg-green-50 text-green-700 border border-green-200`
   - 50–70: `bg-amber-50 text-amber-700 border border-amber-200`
   - <50: `bg-red-50 text-red-700 border border-red-200`
   - Always show the number and a label: "71 · High", "54 · Medium", "42 · Low"
6. **No locality rows** should show "No data yet — be the first to submit" → link to /submit

**Filter implementation**:
```typescript
'use client'
const [search, setSearch] = useState('')
const [zone, setZone] = useState('all')
const [sortBy, setSortBy] = useState('median')

const filtered = localities
  .filter(l => l.name.toLowerCase().includes(search.toLowerCase()))
  .filter(l => zone === 'all' || l.zone === zone)
  .sort((a, b) => {
    if (sortBy === 'median') return b.median - a.median
    if (sortBy === 'trust') return b.trustScore - a.trustScore
    return b.submissionCount - a.submissionCount
  })
```

---

### MICROTASK 3.4 — Redesign individual locality pages

Full redesign of `/hyderabad/[locality]`:

**Layout** (desktop: 2-column, mobile: single stack):
```
Left column (8/12):                Right column (4/12):
┌──────────────────────────┐       ┌────────────────────┐
│ Breadcrumb: Localities > │       │ Submit CTA card    │
│ Gachibowli               │       │ ────────────────── │
│                          │       │ Nearby localities  │
│ Trust-weighted median    │       │ ────────────────── │
│ ₹XX,XXX  [conf badge]    │       │ Compare with...    │
│                          │       └────────────────────┘
│ P25 ₹XX,XXX  P75 ₹XX,XXX│
│ [progress bar]           │
│                          │
│ BHK breakdown table      │
│                          │
│ Recent verified rents    │
│                          │
│ How to use this data     │
└──────────────────────────┘
```

**Stats section** (hero of the page):
- Median number: `Instrument Serif` 48px, with "Trust-weighted median" label above in small caps
- P25/P75: side by side in `font-mono`, smaller, with a coloured range bar between them
- Confidence badge: large pill with colour coding and text ("High confidence — 71/100")
- Submission count: "Based on 58 verified signals" with an info icon linking to /how-data-works

**BHK breakdown**: redesign as a clean table:
```
BHK    Median      Range            Submissions
1BHK   ₹11,905    ₹11,300–₹12,302  17
2BHK   ₹21,006    ₹19,911–₹21,912  28  ← highlighted row (most common)
3BHK   ₹33,504    ₹31,522–₹34,833  7
4BHK   ₹47,312    ₹45,567–₹51,448  6
```
- Highlight the row with the highest submission count
- Use `font-mono` for all numbers
- Show a tiny bar chart of relative submission counts

**Recent rents section**: redesign as a clean feed:
- Each item: BHK badge + rent amount + furnishing + rent-type badge + time ago
- "Closed deal" badge in green, "Renewal" in blue, "Asking" in gray
- Limit to last 10, add "See all X submissions →" link

**Privacy reassurance**: add a small callout below the submit CTA:
"Anonymous · No personal data shown · Your landlord cannot identify you"

---

### MICROTASK 3.5 — Redesign the compare pages

**`/compare` (select page)**:
- Clean centered layout: "Compare two localities"
- Two large combobox inputs side-by-side (searchable dropdowns with autocomplete)
- "vs" divider badge between them
- A list of popular comparisons as suggestion chips below the inputs
- Compare button: full-width on mobile, auto-width on desktop

**`/compare/[a-vs-b]` (results page)**:
- Header: "Bachupally vs Ameerpet — rent comparison"
- Summary callout: "Bachupally is 20% cheaper — median ₹5,058 less per month"
  (style this prominently — it's the money insight)
- Side-by-side stat cards (each locality in its own card)
- BHK comparison table: both localities side-by-side with delta column
  ```
  BHK    Bachupally    Ameerpet    Difference
  1BHK   ₹11,905       ₹14,846     −₹2,941 ↓
  2BHK   ₹21,006       ₹25,743     −₹4,737 ↓
  3BHK   ₹33,504       ₹37,228     −₹3,724 ↓
  ```
  Delta column: green if negative (cheaper), red if positive (more expensive)
- Submission count comparison and trust score comparison
- Bottom: "Compare with other localities" — show ALL other locality comparison links
  grouped by zone, not just 6

---

### MICROTASK 3.6 — Redesign the submit form

Full redesign of `/submit`:

**Layout**: centered, max-width 560px, generous padding

**Visual design**:
- Progress indicator at top: 3 steps: "Location → Details → Submit"
- Step 1: Locality + Micro-locality (searchable select, type to filter)
- Step 2: Rent details (BHK, rent type, furnishing, monthly rent, maintenance, deposit, sqft, date)
- Step 3: Review + submit

OR alternatively (simpler, more effective):
- Single long form with sections visually separated by horizontal rules + section labels
- Section 1: "Where?" — Locality (required), Micro-locality (optional)
- Section 2: "What?" — BHK (button group), Rent type (button group), Furnishing (button group)
- Section 3: "How much?" — Monthly rent (number input), Maintenance (toggle: included/separate + amount), Security deposit, Super built-up sqft, Move-in date
- Section 4: "Who?" — Occupancy type (Family/Bachelor/Single) — optional

**Input styling**:
- Large, tap-friendly inputs: `h-12 rounded-xl border border-border px-4 text-base`
- Button groups (BHK, rent type): segmented control style, not radio buttons
  ```
  [1BHK] [2BHK] [3BHK] [4BHK] [5+]
  ```
  Selected: `bg-accent-primary text-white`, Unselected: `bg-white border border-border`
- Effective monthly cost: large auto-calculated display:
  ```
  Effective monthly cost
  ₹45,500
  (rent ₹42,000 + maintenance ₹3,500)
  ```
  Updates live as user types.

**Privacy banner** (pinned above submit button):
```
🔒 Anonymous submission
Public: locality, BHK, rent amount, furnishing type
Private: your exact address, proof files, personal details
Your landlord cannot identify you.
```

---

### MICROTASK 3.7 — Redesign /how-data-works page

Transform the current plain text page into a visual explainer:

**Structure**:
1. **Hero**: "Built for transparency" — short statement of purpose
2. **Scoring breakdown**: visual card for each factor with its point value:
   ```
   ┌─────────────────────────────────────────────────────┐
   │ Scoring factor               Max points             │
   │ ─────────────────────────────────────────────────── │
   │ Rent type (closed deal)      40 pts   ████████████ │
   │ Proof submitted              +20 pts  ██████       │
   │ Submitter (tenant)           +15 pts  █████        │
   │ Nearby consensus             +15 pts  █████        │
   │ Recency (< 30 days)          +10 pts  ████         │
   │ ─────────────────────────────────────────────────── │
   │ Max possible (tenant+proof)  100 pts               │
   │ Broker cap                   30 pts max            │
   └─────────────────────────────────────────────────────┘
   ```
3. **Privacy model**: visual breakdown of what is and isn't public
4. **Anomaly detection**: simple diagram showing how outliers are flagged
5. **FAQ-style accordion** for "Why does this differ from listings?" etc.

---

### MICROTASK 3.8 — Add global skeleton loaders and loading states

Every async component needs a skeleton loader. Implement using Tailwind's `animate-pulse`:

```tsx
// components/skeletons/LocalityCardSkeleton.tsx
export function LocalityCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border p-5 animate-pulse">
      <div className="h-5 bg-secondary rounded w-1/2 mb-3" />
      <div className="h-8 bg-secondary rounded w-2/3 mb-2" />
      <div className="h-4 bg-secondary rounded w-3/4 mb-4" />
      <div className="h-2 bg-secondary rounded w-full" />
    </div>
  )
}
```

Create skeletons for:
- `LocalityCardSkeleton` — for the /localities page grid
- `StatHeroSkeleton` — for the locality page stat hero
- `BHKTableSkeleton` — for the BHK breakdown
- `CitySignalSkeleton` — for the homepage stats card
- `RecentRentSkeleton` — for the recent rents feed

Use Next.js `<Suspense fallback={<SkeletonComponent />}>` to wrap all async server components.

---

### MICROTASK 3.9 — Add toast notification system

Install and configure a toast system for non-blocking feedback:

```bash
npm install sonner
```

In `app/layout.tsx`, add `<Toaster position="bottom-center" richColors />` to the layout.

Use toasts for:
- Successful rent submission: `toast.success('Rent submitted — thank you!')`
- Form validation errors: `toast.error('Please fill in all required fields')`
- Data load failures: `toast.error('Could not load data. Please refresh.')`
- Issue report sent: `toast.success('Report sent — we will look into it')`

---

### MICROTASK 3.10 — Add BHK sub-pages (/hyderabad/[locality]/[bhk])

**Problem**: `/hyderabad/bachupally/1bhk` etc. are linked but broken.

**Steps**:
1. Create `app/hyderabad/[locality]/[bhk]/page.tsx`
2. Accept `bhk` param as `"1bhk" | "2bhk" | "3bhk" | "4bhk"`
3. Parse the BHK number from the slug: `const bhkNum = parseInt(params.bhk)`
4. Fetch and display only submissions for that BHK:
   - Median, P25, P75 for that BHK only
   - "What's typical for a 2BHK in Bachupally" headline
   - Recent rents for that BHK
   - "Negotiation guide": "Your P25 anchor: ₹19,911 — use this as your opening offer"
5. Add breadcrumb: Localities > Bachupally > 2BHK
6. Proper metadata:
   ```typescript
   export async function generateMetadata({ params }: Props) {
     const bhkNum = params.bhk.replace('bhk', '')
     const name = slugToName(params.locality)
     return buildMetadata({
       title: `${bhkNum}BHK rent in ${name}`,
       description: `Verified ${bhkNum}BHK rent data for ${name}, Hyderabad. Median, P25/P75 range, recent closed deals.`,
       path: `/hyderabad/${params.locality}/${params.bhk}`,
     })
   }
   ```
7. Add `generateStaticParams()` to pre-render all BHK variants for all localities.

---

### MICROTASK 3.11 — Add trust score tooltip across all locality cards

Every trust score badge needs an accessible tooltip explaining what the score means.

```tsx
// components/TrustScoreBadge.tsx
'use client'
import * as Tooltip from '@radix-ui/react-tooltip'

export function TrustScoreBadge({ score }: { score: number }) {
  const level = score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Low'
  const color = score >= 70 ? 'green' : score >= 50 ? 'amber' : 'red'

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className={`badge badge-${color} cursor-help`}>
            {score}/100 · {level} confidence
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content className="tooltip-content" sideOffset={5}>
          Trust score reflects how many submissions are verified closed deals vs asking rents.
          Higher = more reliable. <a href="/how-data-works">Learn more →</a>
          <Tooltip.Arrow className="tooltip-arrow" />
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
```

Install Radix: `npm install @radix-ui/react-tooltip`

---

### MICROTASK 3.12 — Redesign the footer

Replace the current duplicate-link footer with a clean, purposeful footer:

```tsx
export function Footer() {
  return (
    <footer className="border-t border-border mt-20 py-12 bg-secondary/30">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="font-display font-semibold text-lg mb-2">HydRent</div>
          <p className="text-secondary text-sm leading-relaxed">
            Community-verified rent intelligence for Hyderabad.
            Open source. No broker quotes. No ads.
          </p>
        </div>
        <div>
          <div className="font-medium text-sm mb-3">Data</div>
          <div className="flex flex-col gap-2 text-sm text-secondary">
            <Link href="/localities">All localities</Link>
            <Link href="/compare">Compare localities</Link>
            <Link href="/how-data-works">How data works</Link>
          </div>
        </div>
        <div>
          <div className="font-medium text-sm mb-3">Contribute</div>
          <div className="flex flex-col gap-2 text-sm text-secondary">
            <Link href="/submit">Submit your rent</Link>
            <Link href="/issues">Report an issue</Link>
            <a href="https://github.com" target="_blank">GitHub →</a>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 mt-8 pt-8 border-t border-border flex flex-wrap justify-between items-center gap-4 text-sm text-tertiary">
        <span>© 2025 HydRent · Open source civic tech</span>
        <span>Data from real renters, not brokers</span>
      </div>
    </footer>
  )
}
```

---

### MICROTASK 3.13 — Fix freshness/confidence score variance

**Problem**: All localities show 100/100 or near-100 freshness — artificially uniform because all
seed data was inserted at the same time.

**Steps**:
1. Open `lib/trustScore.ts` (or wherever the score is computed).
2. Add submission count factor to the score:
   ```typescript
   function computeConfidenceScore(locality: LocalityStats): number {
     const countFactor = Math.min(locality.submissionCount / 100, 1) // 0–1
     const closedFactor = locality.closedRentShare // 0–1
     const bhkCoverage = locality.bhkVariety / 4 // 0–1 (1BHK through 4BHK)
     const recencyFactor = computeRecencyFactor(locality.submissions)

     return Math.round(
       countFactor * 30 +
       closedFactor * 35 +
       bhkCoverage * 20 +
       recencyFactor * 15
     )
   }
   ```
3. This will naturally differentiate: a locality with 68 submissions of mixed BHK and closed deals
   will score differently from one with 18 asking-rent-only submissions.
4. The score is now meaningful rather than uniform.

---

### MICROTASK 3.14 — Add Hyderabad zone classification to localities

**Steps**:
1. Create `lib/zones.ts`:
   ```typescript
   export const ZONE_MAP: Record<string, string> = {
     'gachibowli': 'West',
     'kondapur': 'West',
     'madhapur': 'West',
     'manikonda': 'West',
     'nallagandla': 'West',
     'kukatpally': 'West',
     'hafeezpet': 'West',
     'miyapur': 'West',
     'chandanagar': 'West',
     'tellapur': 'West',
     'bachupally': 'North',
     'kompally': 'North',
     'nizampet': 'North',
     'banjara-hills': 'Central',
     'jubilee-hills': 'Central',
     'film-nagar': 'Central',
     'punjagutta': 'Central',
     'somajiguda': 'Central',
     'ameerpet': 'Central',
     'sr-nagar': 'Central',
     'himayatnagar': 'Central',
     'begumpet': 'Central',
     'secunderabad': 'East',
     'lb-nagar': 'East',
     'dilsukhnagar': 'East',
     'mehdipatnam': 'South',
     'attapur': 'South',
     'nampally': 'Central',
     'kphb-colony': 'West',
   }

   export function getZone(slug: string): string {
     return ZONE_MAP[slug] ?? 'Other'
   }
   ```
2. Use `getZone(slug)` everywhere a zone label appears — locality cards, locality pages, filters.

---

## MICROTASK GROUP 4 — FINAL POLISH AND DEPLOY

### MICROTASK 4.1 — Install and configure fonts

In `app/layout.tsx`:
```typescript
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600'],
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-display',
  weight: '400',
  style: ['normal', 'italic'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
})
```

In `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      display: ['var(--font-display)', 'Georgia', 'serif'],
      mono: ['var(--font-mono)', 'monospace'],
    },
    colors: {
      'accent-primary': '#1A6B4A',
      'accent-secondary': '#E8593C',
      'background': { DEFAULT: '#FAFAF8', secondary: '#F3F2EE', dark: '#0D0F0E' },
      'border': 'rgba(26,26,24,0.1)',
      'text': { primary: '#1A1A18', secondary: '#6B6B63', tertiary: '#9C9B93' },
    },
  }
}
```

---

### MICROTASK 4.2 — Run full pre-deploy checklist

Execute each of these checks and fix any failures before deploying:

```bash
# 1. TypeScript — must be zero errors
npx tsc --noEmit

# 2. ESLint — must be zero errors (warnings OK)
npx eslint . --ext .ts,.tsx

# 3. Build — must succeed
npm run build

# 4. Check for localhost in code
grep -r "localhost" app/ lib/ components/ --include="*.ts" --include="*.tsx"
# Expected output: nothing (zero matches)

# 5. Check for hardcoded seed disclaimers
grep -r "illustrative" app/ --include="*.tsx" --include="*.ts"
# Expected output: nothing (remove all "seed values are illustrative" text)

# 6. Check all links in nav go to real, working routes
# Manually verify: /, /localities, /compare, /how-data-works, /submit, /issues

# 7. Check og:url on key pages (should all be hydrent.vercel.app/...)
# Run a build and check the HTML source of 3–4 pages
```

---

### MICROTASK 4.3 — Vercel environment variables

Before deploying, ensure ALL of the following environment variables are set in Vercel dashboard
(Settings → Environment Variables → Production):

```
NEXT_PUBLIC_SITE_URL=https://hydrent.vercel.app
NEXT_PUBLIC_SUPABASE_URL=<your supabase project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<your supabase service role key>
```

If `SUPABASE_SERVICE_ROLE_KEY` is used server-side only, confirm it is NOT prefixed with
`NEXT_PUBLIC_` (which would expose it to the browser).

---

### MICROTASK 4.4 — Deploy to Vercel

```bash
# If not already installed
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

OR if the repo is already linked to Vercel via GitHub:
```bash
git add -A
git commit -m "feat: complete UI/UX redesign + all bug fixes

- Fix localhost canonical URL bug across all pages
- Consolidate dual nav into single component with correct routes
- Fix blank locality pages (gachibowli, kondapur etc.)
- Fix ₹0 median in auto-generated paragraph
- Fix raw timestamp dump at bottom of locality pages
- Add loading/success/error states to submit form
- Wire /issues form to Supabase endpoint
- Connect homepage stats to real database values
- Wire compare page dropdown to navigate correctly
- Add correct metadata to all pages
- Generate sitemap.xml and robots.txt
- Complete UI redesign: new design system, typography, cards
- Add skeleton loaders to all async components
- Add toast notification system
- Implement BHK sub-pages with proper metadata
- Add trust score tooltips and zone classification
- Redesign footer with clean structure
- Fix freshness score to have meaningful variance"

git push origin main
```

Vercel will auto-deploy from the main branch push.

---

### MICROTASK 4.5 — Post-deploy verification

After deployment, verify each of these URLs loads correctly and shows real content:

1. `https://hydrent.vercel.app` — homepage with real city stats, working featured cards
2. `https://hydrent.vercel.app/localities` — list of 25 localities with filter/search
3. `https://hydrent.vercel.app/hyderabad/bachupally` — locality page with stats, no ₹0
4. `https://hydrent.vercel.app/hyderabad/bachupally/2bhk` — BHK sub-page
5. `https://hydrent.vercel.app/compare/bachupally-vs-ameerpet` — compare page with data
6. `https://hydrent.vercel.app/compare` — select page with working dropdowns
7. `https://hydrent.vercel.app/submit` — form with validation and success state
8. `https://hydrent.vercel.app/how-data-works` — visual explainer
9. `https://hydrent.vercel.app/issues` — form that actually submits
10. `https://hydrent.vercel.app/sitemap.xml` — renders XML with all locality URLs
11. `https://hydrent.vercel.app/robots.txt` — disallows /admin only

**Social preview check**:
Paste `https://hydrent.vercel.app` into https://www.opengraph.xyz/
→ Title, description, and image must NOT reference localhost
→ og:url must be `https://hydrent.vercel.app`

**Mobile check**:
Open on a real phone (or Chrome DevTools mobile). Verify:
- Nav doesn't overflow
- Cards scroll horizontally on the homepage
- Submit form inputs are tap-friendly (min 44px height)
- No horizontal scroll on any page

---

## IMPORTANT RULES FOR THE AI EXECUTING THIS PROMPT

1. Do NOT skip any microtask. Complete every single one.
2. Do NOT introduce new dependencies unless explicitly listed in this prompt. If you need
   something not listed, use the closest available package already in the project.
3. Every component you touch must use the design system defined at the top. No generic
   gray-on-white layouts with default Tailwind classes. Be intentional.
4. All rent amounts everywhere must be formatted with `toLocaleString('en-IN')` and the `₹` prefix.
5. All async data fetching must have a loading state (skeleton) and an error state (banner or toast).
6. Never render a page that shows ₹0, "undefined", or empty strings where data should appear.
   Always have a fallback.
7. Never hardcode "localhost" in any metadata, canonical, or og:url field. Always use SITE_URL.
8. Keep TypeScript strict. No `any` types unless absolutely unavoidable and explicitly commented.
9. After each microtask group, confirm the build still passes (`npm run build`) before proceeding.
10. The final deployed site must score ≥90 on Lighthouse Performance and ≥95 on SEO.

---

---

## MICROTASK GROUP 5 — MOBILE EXPERIENCE

### MICROTASK 5.1 — Mobile navigation (hamburger menu)

The current nav has no mobile menu. On screens below `md` breakpoint, show a hamburger button
that opens a full-screen drawer nav.

**Implementation**:

```tsx
// Add to Nav.tsx (already created in MICROTASK 1.2)
// Mobile drawer
{menuOpen && (
  <div
    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
    onClick={() => setMenuOpen(false)}
  >
    <div
      className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl p-6 flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      {/* Close button */}
      <button
        onClick={() => setMenuOpen(false)}
        className="self-end mb-6 p-2 rounded-full hover:bg-secondary"
        aria-label="Close menu"
      >
        <XIcon className="w-5 h-5" />
      </button>

      {/* Nav links — large tap targets */}
      <div className="flex flex-col gap-1 flex-1">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base transition-colors ${
              pathname.startsWith(l.href)
                ? 'bg-accent-primary/10 text-accent-primary font-medium'
                : 'text-primary hover:bg-secondary'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Bottom CTA */}
      <Link
        href="/submit"
        onClick={() => setMenuOpen(false)}
        className="btn-primary w-full text-center mt-4"
      >
        Submit your rent
      </Link>

      {/* Footer of drawer */}
      <p className="text-tertiary text-xs text-center mt-4">
        Open source · Built for Hyderabad renters
      </p>
    </div>
  </div>
)}
```

Replace the desktop "Submit rent" button in the nav with this on mobile:
```tsx
<button
  className="md:hidden p-2 rounded-full hover:bg-secondary"
  onClick={() => setMenuOpen(true)}
  aria-label="Open menu"
>
  <MenuIcon className="w-5 h-5" />
</button>
```

---

### MICROTASK 5.2 — Mobile-specific layout for locality pages

On mobile, the 2-column layout (left: stats, right: sidebar) must stack vertically.
The sticky right sidebar (Submit CTA, Nearby localities, Compare with) becomes a
horizontal scroll strip of action cards pinned above the BHK table.

```tsx
// Desktop: grid-cols-[1fr_320px], Mobile: single column
<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
  <main>{/* stats, BHK table, recent rents */}</main>
  <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
    {/* Submit CTA card */}
    {/* Nearby localities */}
    {/* Compare with links */}
  </aside>
</div>
```

On mobile, render the aside BELOW the main stats but ABOVE the BHK table, using a horizontal
scroll container for the action cards:
```tsx
// Mobile-only action strip
<div className="flex gap-3 overflow-x-auto pb-2 lg:hidden snap-x snap-mandatory">
  <SubmitCTACard className="flex-shrink-0 w-64 snap-start" />
  {nearbyLocalities.slice(0, 3).map(l => (
    <NearbyCard key={l.slug} locality={l} className="flex-shrink-0 w-56 snap-start" />
  ))}
</div>
```

---

### MICROTASK 5.3 — Touch-optimised compare dropdowns

On mobile, the two locality dropdowns on `/compare` must be native `<select>` elements
(not custom dropdowns) for better iOS/Android UX:

```tsx
// Detect mobile and render native select
function LocalitySelect({ value, onChange, label }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-secondary">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-12 rounded-xl border border-border px-4 text-base bg-white
                   appearance-none cursor-pointer focus:ring-2 focus:ring-accent-primary/20
                   focus:border-accent-primary outline-none"
      >
        <option value="">Select locality...</option>
        {localities.map(l => (
          <option key={l.slug} value={l.slug}>{l.name}</option>
        ))}
      </select>
    </div>
  )
}
```

---

### MICROTASK 5.4 — Mobile submit form optimisations

1. All number inputs on mobile must use `inputMode="numeric"` to trigger the numeric keyboard:
   ```tsx
   <input
     type="text"
     inputMode="numeric"
     pattern="[0-9]*"
     placeholder="e.g. 25000"
   />
   ```
2. The BHK segmented control must use larger touch targets on mobile:
   ```tsx
   // min-w-[64px] on mobile, min-w-[72px] on desktop
   <button className="min-w-[64px] md:min-w-[72px] h-12 ...">{bhk}BHK</button>
   ```
3. The date picker for "Move-in date" must render as `<input type="date">` with a max
   attribute set to today: `max={new Date().toISOString().split('T')[0]}`
4. The locality select must be a `<select>` on mobile (not a custom dropdown).
5. Add `autocomplete` attributes to relevant fields:
   ```tsx
   <input autocomplete="off" /> // for rent amount (no autocomplete needed)
   ```

---

## MICROTASK GROUP 6 — NEGOTIATION INTELLIGENCE LAYER

This is HydRent's killer feature that bengaluru.rent doesn't have. Implement it across
locality and BHK pages to give renters real negotiation leverage.

### MICROTASK 6.1 — Add "Negotiation guide" section to every BHK page

On each `/hyderabad/[locality]/[bhk]` page, add a dedicated "Negotiation guide" section
below the stats:

```tsx
function NegotiationGuide({ stats, bhk, locality }: NegotiationGuideProps) {
  const anchorPrice = stats.p25
  const fairPrice = stats.median
  const overpaying = stats.p75

  return (
    <section className="rounded-2xl border border-border bg-white p-6 mt-6">
      <h2 className="font-display text-xl font-semibold mb-1">
        Negotiation intelligence
      </h2>
      <p className="text-secondary text-sm mb-6">
        Use verified rent data to negotiate from a position of knowledge, not guesswork.
      </p>

      {/* Three-step guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-green-50 border border-green-100 p-4">
          <div className="text-xs font-medium text-green-700 mb-1 uppercase tracking-wide">
            Opening offer (P25)
          </div>
          <div className="font-mono text-2xl font-semibold text-green-800">
            ₹{anchorPrice.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-green-600 mt-1">
            25% of renters pay this or less. Start here.
          </div>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
          <div className="text-xs font-medium text-blue-700 mb-1 uppercase tracking-wide">
            Fair market (Median)
          </div>
          <div className="font-mono text-2xl font-semibold text-blue-800">
            ₹{fairPrice.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            The middle of verified closed deals.
          </div>
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
          <div className="text-xs font-medium text-amber-700 mb-1 uppercase tracking-wide">
            Walk away (P75)
          </div>
          <div className="font-mono text-2xl font-semibold text-amber-800">
            ₹{overpaying.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-amber-600 mt-1">
            Above this, you're in the top 25%. Reconsider.
          </div>
        </div>
      </div>

      {/* Script */}
      <div className="bg-secondary rounded-xl p-4">
        <div className="text-xs font-medium text-tertiary uppercase tracking-wide mb-2">
          What to say to the landlord
        </div>
        <p className="text-sm text-primary leading-relaxed italic">
          "I've seen verified data showing {bhk}BHK rents in {locality} around
          ₹{fairPrice.toLocaleString('en-IN')}. I'd like to start at
          ₹{anchorPrice.toLocaleString('en-IN')} — I'm a reliable long-term tenant
          and can provide references."
        </p>
      </div>

      {/* Caveats */}
      <p className="text-xs text-tertiary mt-4">
        Based on {stats.submissionCount} verified submissions. Actual rent depends on
        floor, view, age of building, and furnishing. Data updated as new rents are submitted.
      </p>
    </section>
  )
}
```

---

### MICROTASK 6.2 — Add "Is this rent fair?" inline calculator

On individual locality and BHK pages, add a small interactive widget below the BHK table:

```tsx
'use client'
function FairnessCalculator({ stats }: { stats: LocalityBHKStats[] }) {
  const [inputRent, setInputRent] = useState('')
  const [selectedBHK, setSelectedBHK] = useState<number>(2)

  const bhkStats = stats.find(s => s.bhk === selectedBHK)
  const rent = parseInt(inputRent.replace(/,/g, ''), 10)

  function getFairnessVerdict() {
    if (!bhkStats || isNaN(rent) || rent <= 0) return null
    if (rent <= bhkStats.p25) return { label: 'Great deal', color: 'green', message: `This is below the P25 (₹${bhkStats.p25.toLocaleString('en-IN')}). You are paying less than 75% of renters.` }
    if (rent <= bhkStats.median) return { label: 'Fair price', color: 'blue', message: `This is between P25 and the median. A reasonable rate for ${selectedBHK}BHK here.` }
    if (rent <= bhkStats.p75) return { label: 'Slightly above median', color: 'amber', message: `This is between the median and P75. You may be able to negotiate down to ₹${bhkStats.median.toLocaleString('en-IN')}.` }
    return { label: 'Overpaying', color: 'red', message: `This is above the P75 (₹${bhkStats.p75.toLocaleString('en-IN')}). You are paying more than 75% of renters. Push back hard.` }
  }

  const verdict = getFairnessVerdict()

  return (
    <div className="rounded-2xl border border-border bg-white p-6 mt-6">
      <h3 className="font-semibold text-base mb-4">Is this rent fair?</h3>
      <div className="flex gap-3 mb-4">
        {/* BHK selector */}
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(b => (
            <button
              key={b}
              onClick={() => setSelectedBHK(b)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedBHK === b
                  ? 'bg-accent-primary text-white'
                  : 'bg-secondary text-secondary hover:text-primary'
              }`}
            >
              {b}BHK
            </button>
          ))}
        </div>
        {/* Rent input */}
        <input
          type="text"
          inputMode="numeric"
          value={inputRent}
          onChange={e => setInputRent(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="Enter monthly rent..."
          className="flex-1 h-9 rounded-lg border border-border px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
        />
      </div>

      {verdict && (
        <div className={`rounded-xl p-4 bg-${verdict.color}-50 border border-${verdict.color}-100`}>
          <div className={`font-semibold text-${verdict.color}-800 mb-1`}>{verdict.label}</div>
          <div className={`text-sm text-${verdict.color}-700`}>{verdict.message}</div>
        </div>
      )}
    </div>
  )
}
```

---

## MICROTASK GROUP 7 — SUPABASE SCHEMA REFERENCE

The AI executing this prompt must know the exact database schema to write correct queries.
Here is the expected schema. If the real schema differs, adapt queries accordingly.

### Expected `submissions` table schema

```sql
CREATE TABLE submissions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  locality_slug text NOT NULL,               -- e.g. 'bachupally', 'gachibowli'
  micro_locality text,                        -- e.g. 'Near Metro Station'
  bhk           int NOT NULL,                 -- 1, 2, 3, 4, 5
  rent_type     text NOT NULL,                -- 'closed', 'renewal', 'asking'
  monthly_rent  numeric NOT NULL,             -- base rent in INR
  maintenance   numeric DEFAULT 0,            -- monthly maintenance if separate
  maintenance_included boolean DEFAULT false, -- true if maintenance is in rent
  effective_monthly_cost numeric NOT NULL,    -- rent + (maintenance_included ? 0 : maintenance)
  furnishing    text,                         -- 'furnished', 'semi-furnished', 'unfurnished'
  occupancy     text,                         -- 'family', 'bachelor', 'single'
  sqft          numeric,                      -- super built-up area
  move_in_date  date,                         -- when this rent started
  trust_score   int DEFAULT 0,                -- computed weight 0-100
  is_approved   boolean DEFAULT false,        -- moderation flag
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Indices for performance
CREATE INDEX idx_submissions_locality ON submissions(locality_slug);
CREATE INDEX idx_submissions_bhk ON submissions(locality_slug, bhk);
CREATE INDEX idx_submissions_approved ON submissions(is_approved) WHERE is_approved = true;
CREATE INDEX idx_submissions_created ON submissions(created_at DESC);
```

### Computed locality stats query

Use this query pattern for locality stats (adapt column names to match real schema):

```sql
-- Locality-level stats
SELECT
  locality_slug,
  COUNT(*) as submission_count,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY effective_monthly_cost) as median,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY effective_monthly_cost) as p25,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY effective_monthly_cost) as p75,
  ROUND(AVG(trust_score)) as avg_trust,
  ROUND(100.0 * SUM(CASE WHEN rent_type = 'closed' THEN 1 ELSE 0 END) / COUNT(*)) as closed_share
FROM submissions
WHERE is_approved = true
GROUP BY locality_slug;
```

### BHK-level stats query

```sql
-- BHK breakdown for a single locality
SELECT
  bhk,
  COUNT(*) as count,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY effective_monthly_cost) as median,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY effective_monthly_cost) as p25,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY effective_monthly_cost) as p75
FROM submissions
WHERE locality_slug = $1
  AND is_approved = true
GROUP BY bhk
ORDER BY bhk;
```

### City-wide stats query

```sql
SELECT
  COUNT(*) as total_submissions,
  COUNT(DISTINCT locality_slug) as locality_count,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY effective_monthly_cost) as city_median,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY effective_monthly_cost) as city_p25,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY effective_monthly_cost) as city_p75,
  ROUND(100.0 * SUM(CASE WHEN rent_type = 'closed' THEN 1 ELSE 0 END) / COUNT(*)) as closed_share
FROM submissions
WHERE is_approved = true;
```

### Row Level Security (RLS)

Ensure Supabase RLS is configured correctly:

```sql
-- Public can read approved submissions only
CREATE POLICY "Public read approved submissions"
  ON submissions FOR SELECT
  USING (is_approved = true);

-- Anyone can insert (anonymous submissions allowed)
CREATE POLICY "Anyone can submit"
  ON submissions FOR INSERT
  WITH CHECK (true);

-- Only service role can update (for moderation)
-- No UPDATE policy for anon role
```

---

## MICROTASK GROUP 8 — COMPONENT LIBRARY REFERENCE

This section gives the AI exact class patterns to use for every reusable element.
All patterns use the Tailwind classes defined in the design system.

### Buttons

```tsx
// Primary (coral CTA)
className="inline-flex items-center justify-center gap-2 bg-accent-secondary text-white font-medium text-sm px-5 py-2.5 rounded-full hover:bg-accent-secondary/90 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"

// Secondary (ghost)
className="inline-flex items-center justify-center gap-2 border border-border text-primary font-medium text-sm px-5 py-2.5 rounded-full hover:bg-secondary active:scale-95 transition-all duration-150"

// Trust / verified (green)
className="inline-flex items-center justify-center gap-2 bg-accent-primary text-white font-medium text-sm px-5 py-2.5 rounded-full hover:bg-accent-primary/90 active:scale-95 transition-all duration-150"

// Destructive
className="inline-flex items-center justify-center gap-2 bg-red-600 text-white font-medium text-sm px-5 py-2.5 rounded-full hover:bg-red-700 active:scale-95 transition-all duration-150"
```

### Input fields

```tsx
// Standard input
className="w-full h-12 rounded-xl border border-border bg-white px-4 text-base text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary/50 transition-all"

// Input with error state
className="w-full h-12 rounded-xl border border-red-300 bg-red-50 px-4 text-base focus:outline-none focus:ring-2 focus:ring-red-200"

// Input with success state
className="w-full h-12 rounded-xl border border-green-300 bg-green-50 px-4 text-base focus:outline-none focus:ring-2 focus:ring-green-200"
```

### Cards

```tsx
// Standard card
className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"

// Stat card (no hover)
className="rounded-2xl border border-border bg-white p-5 shadow-sm"

// Highlight card (accent border)
className="rounded-2xl border-2 border-accent-primary/20 bg-accent-primary/5 p-5"

// Warning card
className="rounded-2xl border border-amber-200 bg-amber-50 p-5"

// Dark card
className="rounded-2xl bg-background-dark text-white p-5"
```

### Badges / pills

```tsx
// Zone badge
className="rounded-full text-xs font-medium px-2.5 py-1 bg-secondary text-secondary"

// Trust — high
className="rounded-full text-xs font-medium px-2.5 py-1 bg-green-50 text-green-700 border border-green-200"

// Trust — medium
className="rounded-full text-xs font-medium px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200"

// Trust — low
className="rounded-full text-xs font-medium px-2.5 py-1 bg-red-50 text-red-700 border border-red-200"

// Rent type — closed deal
className="rounded-full text-xs font-medium px-2.5 py-1 bg-green-100 text-green-800"

// Rent type — renewal
className="rounded-full text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-800"

// Rent type — asking
className="rounded-full text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600"
```

### Section headers

```tsx
// Page title
className="font-display text-3xl md:text-4xl font-semibold text-primary leading-tight"

// Section heading
className="font-semibold text-xl text-primary"

// Subsection label
className="text-xs font-semibold text-tertiary uppercase tracking-widest"

// Body text
className="text-sm text-secondary leading-relaxed"
```

### Skeleton loaders

```tsx
// Text line
className="h-4 bg-secondary rounded-full animate-pulse"

// Heading line
className="h-6 bg-secondary rounded-full animate-pulse w-2/3"

// Number (mono stat)
className="h-8 bg-secondary rounded-lg animate-pulse w-32"

// Card shell
className="rounded-2xl border border-border p-5 animate-pulse space-y-3"
```

### Progress / trust bar

```tsx
// Trust bar container
className="h-1.5 rounded-full bg-secondary overflow-hidden"

// Trust bar fill — green (>70)
className="h-full rounded-full bg-green-500 transition-all duration-500"
style={{ width: `${score}%` }}

// Trust bar fill — amber (50–70)
className="h-full rounded-full bg-amber-400 transition-all duration-500"

// Trust bar fill — red (<50)
className="h-full rounded-full bg-red-400 transition-all duration-500"
```

### Dividers

```tsx
// Section divider
className="border-t border-border my-8"

// Subtle divider
className="border-t border-border/50 my-6"
```

### Page container

```tsx
// Standard page wrapper
className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12"

// Narrow centered (forms, articles)
className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12"

// Full-width section
className="w-full bg-secondary/40 py-12 sm:py-16"
```

---

## MICROTASK GROUP 9 — ACCESSIBILITY AND PERFORMANCE

### MICROTASK 9.1 — Accessibility audit and fixes

Apply these accessibility fixes across all pages:

1. **All images need alt text**. The og:image and any illustrative SVGs must have descriptive alt.
2. **All interactive elements need focus styles**:
   ```tsx
   // Add to global CSS / tailwind.config.ts
   // focus-visible ring on all interactive elements
   'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50'
   ```
3. **Form labels must be associated with inputs**:
   ```tsx
   <label htmlFor="monthly-rent" className="text-sm font-medium">Monthly rent</label>
   <input id="monthly-rent" ... />
   ```
4. **Colour contrast**: ensure all text passes WCAG AA (4.5:1 for normal, 3:1 for large).
   The accent-primary `#1A6B4A` on white passes AA. Verify tertiary text `#9C9B93` is only
   used for decorative/non-essential text (it may fail AA on white).
5. **Keyboard navigation**: the segmented BHK control must be navigable via arrow keys:
   ```tsx
   onKeyDown={e => {
     if (e.key === 'ArrowRight') setSelectedBHK(Math.min(selectedBHK + 1, 5))
     if (e.key === 'ArrowLeft') setSelectedBHK(Math.max(selectedBHK - 1, 1))
   }}
   ```
6. **Skip to content link** (add to `app/layout.tsx`, hidden until focused):
   ```tsx
   <a
     href="#main-content"
     className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
   >
     Skip to content
   </a>
   ```
7. **ARIA labels** on icon-only buttons (hamburger, close, info icons).
8. **Table accessibility** on the BHK breakdown: add `<caption>`, `scope="col"` on `<th>` elements.

---

### MICROTASK 9.2 — Performance optimisations

1. **Static generation**: all locality and compare pages must use `generateStaticParams()` to be
   statically generated at build time. They must NOT be dynamically rendered on every request.
   ```typescript
   // app/hyderabad/[locality]/page.tsx
   export async function generateStaticParams() {
     const supabase = createClient()
     const { data } = await supabase
       .from('submissions')
       .select('locality_slug')
     const slugs = [...new Set((data ?? []).map(d => d.locality_slug))]
     return slugs.map(slug => ({ locality: slug }))
   }
   ```
   Add `export const revalidate = 3600` (revalidate every hour) to locality pages.

2. **Image optimisation**: if any images are used, use `next/image` with explicit `width`/`height`.

3. **Font display**: ensure `next/font/google` uses `display: 'swap'` (it does by default).

4. **Bundle size**: avoid importing entire libraries. Use named imports:
   ```typescript
   // Good
   import { format } from 'date-fns'
   // Bad
   import * as dateFns from 'date-fns'
   ```

5. **Supabase query efficiency**: never `SELECT *`. Always select only the columns you need.
   ```typescript
   // Good
   .select('locality_slug, effective_monthly_cost, bhk, rent_type, trust_score')
   // Bad
   .select('*')
   ```

6. **React cache**: wrap repeated server-side data fetches with `cache()` from React to
   avoid duplicate database calls within the same render tree.

---

## MICROTASK GROUP 10 — FINAL QUALITY GATES

Before the final deploy commit, the AI must verify ALL of the following pass.
Treat each as a blocking requirement — do not deploy until all pass.

### Code quality gates

```bash
# Gate 1: TypeScript — zero errors
npx tsc --noEmit 2>&1 | grep -c "error TS"
# Must output: 0

# Gate 2: No localhost in source
grep -r "localhost" app/ lib/ components/ --include="*.ts" --include="*.tsx" | grep -v "// " | grep -v ".env.example"
# Must output: nothing

# Gate 3: No "illustrative" or "seed values" disclaimer in rendered content
grep -r "illustrative\|seed values are" app/ --include="*.tsx" --include="*.ts" | grep -v "// "
# Must output: nothing

# Gate 4: Build succeeds
npm run build
# Must exit with code 0

# Gate 5: No hardcoded rent amounts in JSX (all must come from data)
# Manually verify: search for "₹47,000" or "₹37,700" in source
grep -r "₹47,000\|₹37,700\|₹68,200" app/ --include="*.tsx"
# Must output: nothing (these were the hardcoded seed values)
```

### UI quality gates (manual visual check)

Open each page in a browser and verify:

| Page | Check |
|------|-------|
| `/` | City signal shows real numbers, not 47,000 / 6 localities |
| `/` | All featured locality cards link to pages that load with data |
| `/localities` | Search input filters cards in real time |
| `/localities` | Zone filter pills work |
| `/localities` | Trust scores differ meaningfully (not all 100/100) |
| `/hyderabad/bachupally` | Stat hero shows real median (not ₹0) |
| `/hyderabad/bachupally` | Auto-paragraph shows real numbers (not "₹0 to ₹0") |
| `/hyderabad/bachupally` | Recent rents section shows structured items (not raw timestamps) |
| `/hyderabad/bachupally/2bhk` | BHK sub-page loads with stats |
| `/hyderabad/bachupally/2bhk` | Negotiation guide section shows P25/median/P75 |
| `/compare` | Dropdown has all localities, Compare button works |
| `/compare/bachupally-vs-ameerpet` | Delta column shows differences |
| `/submit` | Form validates on blur, shows inline errors |
| `/submit` | Submit button shows loading spinner while submitting |
| `/submit` | Shows success state after submission |
| `/issues` | Form submits successfully (check Supabase for the row) |
| Any page | View source: canonical must be `https://hydrent.vercel.app/[path]` |
| Any page | View source: og:url must be `https://hydrent.vercel.app/[path]` |
| Mobile | Nav hamburger opens drawer |
| Mobile | No horizontal scroll on any page |
| Mobile | Submit form numeric inputs trigger number keyboard |

### Performance gate

Run Lighthouse on the deployed URL:
- Performance: ≥ 90
- Accessibility: ≥ 90
- Best Practices: ≥ 95
- SEO: ≥ 95

If any score fails, fix the top 3 Lighthouse recommendations before calling the task complete.

---

## APPENDIX — FULL FILE STRUCTURE

The final project should have this structure (key files only):

```
hydrent/
├── app/
│   ├── layout.tsx                    ← fonts, Nav, Footer, Toaster
│   ├── page.tsx                      ← homepage (real data)
│   ├── sitemap.ts                    ← dynamic sitemap
│   ├── robots.ts                     ← robots.txt
│   ├── globals.css                   ← CSS variables, base styles
│   ├── hyderabad/
│   │   └── [locality]/
│   │       ├── page.tsx              ← locality page (fixed)
│   │       └── [bhk]/
│   │           └── page.tsx          ← BHK sub-page (new)
│   ├── compare/
│   │   ├── page.tsx                  ← compare selector (fixed)
│   │   └── [comparison]/
│   │       └── page.tsx              ← compare results (fixed)
│   ├── localities/
│   │   └── page.tsx                  ← all localities (redesigned)
│   ├── submit/
│   │   └── page.tsx                  ← submit form (fixed)
│   ├── how-data-works/
│   │   └── page.tsx                  ← visual explainer (redesigned)
│   ├── issues/
│   │   └── page.tsx                  ← issues form (fixed)
│   └── api/
│       └── report-issue/
│           └── route.ts              ← issue report API endpoint (new)
├── components/
│   ├── Nav.tsx                       ← single consolidated nav
│   ├── Footer.tsx                    ← redesigned footer
│   ├── TrustScoreBadge.tsx           ← tooltip-enabled badge
│   ├── LocalityEmptyState.tsx        ← empty state for localities
│   ├── NegotiationGuide.tsx          ← negotiation intelligence section
│   ├── FairnessCalculator.tsx        ← interactive rent checker
│   └── skeletons/
│       ├── LocalityCardSkeleton.tsx
│       ├── StatHeroSkeleton.tsx
│       ├── BHKTableSkeleton.tsx
│       ├── CitySignalSkeleton.tsx
│       └── RecentRentSkeleton.tsx
├── lib/
│   ├── siteConfig.ts                 ← SITE_URL, SITE_NAME (new)
│   ├── metadata.ts                   ← buildMetadata() utility (new)
│   ├── getCityStats.ts               ← city-wide stats from Supabase (new)
│   ├── getLocalityData.ts            ← locality stats + BHK breakdown
│   ├── zones.ts                      ← ZONE_MAP for 25 localities (new)
│   ├── trustScore.ts                 ← confidence score computation (fixed)
│   └── supabase/
│       ├── client.ts                 ← browser client
│       └── server.ts                 ← server client
├── .env.local                        ← NEXT_PUBLIC_SITE_URL + Supabase keys
└── tailwind.config.ts                ← extended with design system tokens
```

---

## DEPLOY COMMAND SEQUENCE

Run these commands in order after all microtasks pass their gates:

```bash
# 1. Final build check
npm run build

# 2. Stage all changes
git add -A

# 3. Commit with full message
git commit -m "feat: complete rebuild — UI redesign + all bug fixes + negotiation layer

FIXES:
- Fix localhost canonical/og:url across all pages (CRITICAL)
- Consolidate dual nav into single component with correct routes (CRITICAL)
- Fix blank locality pages — gachibowli, kondapur, madhapur (CRITICAL)
- Fix ₹0 median in auto-generated paragraph (CRITICAL)
- Fix raw timestamp dump at bottom of locality pages (CRITICAL)
- Add loading/success/error states to submit form (CRITICAL)
- Wire /issues form to Supabase endpoint (HIGH)
- Connect homepage stats to real database (HIGH)
- Wire compare dropdown to navigate correctly (HIGH)
- Fix all forms: client-side validation, live effective cost calc (HIGH)
- Fix freshness/trust score variance (MEDIUM)
- Fix BHK sub-page routes (MEDIUM)

NEW FEATURES:
- Negotiation intelligence guide (P25/median/P75 + script)
- Is this rent fair? inline calculator
- Zone classification for all 25 localities
- Trust score tooltip with link to how-data-works
- Mobile hamburger drawer nav
- Dynamic sitemap.xml covering all locality + compare pages
- robots.txt

UI/UX REDESIGN:
- New design system: Instrument Serif + Inter + JetBrains Mono
- New colour palette: warm off-white + teal-green + coral
- Skeleton loaders on all async components
- Toast notifications via Sonner
- Homepage hero redesign with dot-grid background
- Locality cards redesigned with trust bar
- /localities page with search + zone filter + sort
- Individual locality page 2-column layout
- Compare page with delta column and summary callout
- Submit form redesigned with segmented controls
- How-data-works redesigned as visual explainer
- Footer redesigned (removes duplicate nav links)
- Full accessibility pass (WCAG AA, keyboard nav, ARIA)

PERFORMANCE:
- generateStaticParams() on all locality + compare pages
- revalidate = 3600 on data pages
- Selective Supabase columns (no SELECT *)
- React cache() on repeated data fetches"

# 4. Push to main → triggers Vercel auto-deploy
git push origin main

# 5. Monitor deploy
vercel logs --follow
# OR watch at https://vercel.com/dashboard

# 6. Post-deploy: verify live site
curl -I https://hydrent.vercel.app | grep -E "HTTP|canonical"
```

---

---

## MICROTASK GROUP 11 — COMPLETE CSS AND TAILWIND CONFIGURATION

These are the exact files to write. Do not approximate — write them verbatim.

### MICROTASK 11.1 — Write `app/globals.css` in full

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ─── CSS custom properties ─────────────────────────────────────── */
:root {
  /* Colours */
  --color-bg:            #FAFAF8;
  --color-bg-secondary:  #F3F2EE;
  --color-bg-dark:       #0D0F0E;
  --color-accent:        #1A6B4A;
  --color-cta:           #E8593C;
  --color-text-1:        #1A1A18;
  --color-text-2:        #6B6B63;
  --color-text-3:        #9C9B93;
  --color-border:        rgba(26, 26, 24, 0.10);
  --color-border-strong: rgba(26, 26, 24, 0.20);

  /* Spacing scale */
  --page-px:  clamp(1rem, 4vw, 1.5rem);
  --page-max: 1100px;
}

/* ─── Base resets ───────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  scroll-behavior: smooth;
  text-rendering: optimizeLegibility;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text-1);
  font-family: var(--font-inter), system-ui, sans-serif;
  min-height: 100dvh;
}

/* Remove default focus outline — we use focus-visible only */
:focus { outline: none; }
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: 4px;
}

/* ─── Typography ────────────────────────────────────────────────── */
.font-display { font-family: var(--font-display), Georgia, serif; }
.font-mono    { font-family: var(--font-mono), monospace; }

/* Hero number — large italic serif for rent amounts in hero */
.hero-number {
  font-family: var(--font-display), Georgia, serif;
  font-style: italic;
  font-size: clamp(2.5rem, 6vw, 4rem);
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--color-text-1);
}

/* Stat number — monospaced rent figure */
.stat-number {
  font-family: var(--font-mono), monospace;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-text-1);
}

/* ─── Layout utilities ──────────────────────────────────────────── */
.page-wrapper {
  max-width: var(--page-max);
  margin-inline: auto;
  padding-inline: var(--page-px);
}

.page-section {
  padding-block: clamp(3rem, 6vw, 5rem);
}

/* Dot-grid decorative background (used in hero) */
.dot-grid {
  background-image: radial-gradient(circle, rgba(26,26,24,0.08) 1px, transparent 1px);
  background-size: 22px 22px;
}

/* ─── Component classes ─────────────────────────────────────────── */

/* Buttons */
.btn-primary {
  @apply inline-flex items-center justify-center gap-2
         bg-[#E8593C] text-white font-medium text-sm
         px-5 py-2.5 rounded-full
         hover:bg-[#d44e33] active:scale-95
         transition-all duration-150
         disabled:opacity-50 disabled:cursor-not-allowed
         focus-visible:ring-2 focus-visible:ring-[#E8593C]/50;
}

.btn-trust {
  @apply inline-flex items-center justify-center gap-2
         bg-[#1A6B4A] text-white font-medium text-sm
         px-5 py-2.5 rounded-full
         hover:bg-[#155a3e] active:scale-95
         transition-all duration-150
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply inline-flex items-center justify-center gap-2
         border border-[rgba(26,26,24,0.12)] text-[#1A1A18] font-medium text-sm
         px-5 py-2.5 rounded-full bg-white
         hover:bg-[#F3F2EE] active:scale-95
         transition-all duration-150;
}

/* Cards */
.card {
  @apply rounded-2xl border border-[rgba(26,26,24,0.10)]
         bg-white shadow-sm
         hover:shadow-md hover:-translate-y-0.5
         transition-all duration-200;
}

.card-static {
  @apply rounded-2xl border border-[rgba(26,26,24,0.10)] bg-white shadow-sm;
}

.card-accent {
  @apply rounded-2xl border-2 border-[#1A6B4A]/20 bg-[#1A6B4A]/5;
}

/* Form inputs */
.input {
  @apply w-full h-12 rounded-xl border border-[rgba(26,26,24,0.12)]
         bg-white px-4 text-base text-[#1A1A18]
         placeholder:text-[#9C9B93]
         focus:outline-none focus:ring-2 focus:ring-[#1A6B4A]/20
         focus:border-[#1A6B4A]/40
         transition-all duration-150;
}

.input-error {
  @apply border-red-300 bg-red-50
         focus:ring-red-200 focus:border-red-400;
}

/* Badges */
.badge {
  @apply inline-flex items-center rounded-full text-xs font-medium px-2.5 py-1;
}

.badge-green  { @apply bg-green-50  text-green-700  border border-green-200; }
.badge-amber  { @apply bg-amber-50  text-amber-700  border border-amber-200; }
.badge-red    { @apply bg-red-50    text-red-700    border border-red-200;   }
.badge-blue   { @apply bg-blue-50   text-blue-700   border border-blue-200;  }
.badge-gray   { @apply bg-gray-100  text-gray-600   border border-gray-200;  }
.badge-teal   { @apply bg-[#1A6B4A]/10 text-[#1A6B4A] border border-[#1A6B4A]/20; }

/* Trust bar */
.trust-bar-track {
  @apply h-1.5 rounded-full bg-[#F3F2EE] overflow-hidden;
}
.trust-bar-fill {
  @apply h-full rounded-full transition-all duration-500 ease-out;
}

/* Section label (small caps above a heading) */
.section-eyebrow {
  @apply text-xs font-semibold text-[#9C9B93]
         uppercase tracking-[0.08em] mb-2;
}

/* Divider */
.divider { @apply border-t border-[rgba(26,26,24,0.10)]; }

/* Skeleton pulse */
.skeleton { @apply bg-[#F3F2EE] rounded-lg animate-pulse; }

/* ─── Tooltip (Radix UI) ────────────────────────────────────────── */
.tooltip-content {
  @apply bg-[#1A1A18] text-white text-xs rounded-lg px-3 py-2
         shadow-lg max-w-[240px] leading-relaxed z-50;
  animation: tooltipIn 150ms ease-out;
}

.tooltip-arrow { @apply fill-[#1A1A18]; }

@keyframes tooltipIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

/* ─── Sonner toast overrides ────────────────────────────────────── */
[data-sonner-toaster] [data-type="success"] {
  background: #F0FDF4 !important;
  border-color: #BBF7D0 !important;
  color: #166534 !important;
}
[data-sonner-toaster] [data-type="error"] {
  background: #FEF2F2 !important;
  border-color: #FECACA !important;
  color: #991B1B !important;
}

/* ─── Page transition ───────────────────────────────────────────── */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.page-enter {
  animation: fadeInUp 300ms ease-out forwards;
}

/* ─── Scrollbar (thin, branded) ─────────────────────────────────── */
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(26, 26, 24, 0.18);
  border-radius: 99px;
}
::-webkit-scrollbar-thumb:hover { background: rgba(26, 26, 24, 0.3); }

/* ─── Print ─────────────────────────────────────────────────────── */
@media print {
  nav, footer, .no-print { display: none !important; }
  .card { box-shadow: none; border: 1px solid #ccc; }
}
```

---

### MICROTASK 11.2 — Write `tailwind.config.ts` in full

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      /* ── Fonts ── */
      fontFamily: {
        sans:    ['var(--font-inter)',    'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia',   'serif'     ],
        mono:    ['var(--font-mono)',     'ui-monospace', 'monospace'],
      },

      /* ── Colours ── */
      colors: {
        'accent-primary':   '#1A6B4A',
        'accent-secondary': '#E8593C',
        background: {
          DEFAULT:   '#FAFAF8',
          secondary: '#F3F2EE',
          dark:      '#0D0F0E',
        },
        border: 'rgba(26,26,24,0.10)',
        'border-strong': 'rgba(26,26,24,0.20)',
        text: {
          primary:   '#1A1A18',
          secondary: '#6B6B63',
          tertiary:  '#9C9B93',
        },
      },

      /* ── Border radius ── */
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      /* ── Box shadows ── */
      boxShadow: {
        sm:  '0 1px 3px rgba(26,26,24,0.06), 0 1px 2px rgba(26,26,24,0.04)',
        md:  '0 4px 12px rgba(26,26,24,0.08), 0 2px 6px rgba(26,26,24,0.04)',
        lg:  '0 12px 32px rgba(26,26,24,0.10), 0 4px 12px rgba(26,26,24,0.06)',
        xl:  '0 24px 48px rgba(26,26,24,0.12), 0 8px 20px rgba(26,26,24,0.06)',
        'inner-sm': 'inset 0 1px 3px rgba(26,26,24,0.06)',
      },

      /* ── Spacing extras ── */
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },

      /* ── Typography scale extras ── */
      fontSize: {
        '2xs': ['0.65rem',  { lineHeight: '1rem'  }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem',  { lineHeight: '2.5rem',  letterSpacing: '-0.02em' }],
        '5xl': ['3rem',     { lineHeight: '1',        letterSpacing: '-0.03em' }],
        '6xl': ['3.75rem',  { lineHeight: '1',        letterSpacing: '-0.03em' }],
      },

      /* ── Max widths ── */
      maxWidth: {
        'page': '1100px',
        'prose': '680px',
        'form':  '560px',
      },

      /* ── Animations ── */
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)'    },
        },
        countUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)'  },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      animation: {
        'fade-in-up':    'fadeInUp 300ms ease-out forwards',
        'fade-in':       'fadeIn 200ms ease-out forwards',
        'slide-in-right':'slideInRight 250ms ease-out forwards',
        'count-up':      'countUp 400ms ease-out forwards',
        'shimmer':       'shimmer 1.5s infinite linear',
        'pulse-slow':    'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },

      /* ── Background patterns ── */
      backgroundImage: {
        'dot-grid': 'radial-gradient(circle, rgba(26,26,24,0.08) 1px, transparent 1px)',
        'gradient-hero': 'linear-gradient(135deg, #FAFAF8 0%, #F0F5F2 100%)',
        'gradient-card': 'linear-gradient(135deg, #ffffff 0%, #f9faf9 100%)',
      },
      backgroundSize: {
        'dot-grid': '22px 22px',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## MICROTASK GROUP 12 — ADVANCED DATA FEATURES

### MICROTASK 12.1 — Monthly rent trend chart per locality

Implement a real trend chart using `recharts` (already available in the project or install with
`npm install recharts`).

**Create `components/LocalityTrendChart.tsx`**:

```tsx
'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

interface TrendPoint {
  month: string      // e.g. "Jan '25"
  median: number
  p25: number
  p75: number
  count: number
}

interface Props {
  data: TrendPoint[]
  localityName: string
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card-static p-3 text-sm shadow-lg">
      <p className="font-medium text-text-primary mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text-secondary capitalize">{p.dataKey}:</span>
          <span className="font-mono font-medium">
            ₹{p.value.toLocaleString('en-IN')}
          </span>
        </div>
      ))}
      <p className="text-text-tertiary text-xs mt-1">
        {payload[0]?.payload?.count} submissions
      </p>
    </div>
  )
}

export function LocalityTrendChart({ data, localityName }: Props) {
  if (!data || data.length < 2) {
    return (
      <div className="card-static p-6 text-center">
        <p className="text-text-secondary text-sm">
          Not enough data yet for a trend chart.
        </p>
        <p className="text-text-tertiary text-xs mt-1">
          Trend charts appear once 3+ months of submissions are available.
        </p>
      </div>
    )
  }

  return (
    <div className="card-static p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-base">{localityName} rent trend</h3>
          <p className="text-text-secondary text-sm mt-0.5">
            Monthly median with P25–P75 range
          </p>
        </div>
        <span className="badge badge-teal">Live data</span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,24,0.06)" />

          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#9C9B93' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: '#9C9B93' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* P25 line — dashed, muted green */}
          <Line
            type="monotone"
            dataKey="p25"
            stroke="#86EFAC"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 3, fill: '#16A34A' }}
          />

          {/* Median line — solid, accent green */}
          <Line
            type="monotone"
            dataKey="median"
            stroke="#1A6B4A"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: '#1A6B4A', stroke: 'white', strokeWidth: 2 }}
          />

          {/* P75 line — dashed, muted amber */}
          <Line
            type="monotone"
            dataKey="p75"
            stroke="#FCD34D"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 3, fill: '#CA8A04' }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex gap-4 mt-4 justify-center">
        {[
          { color: '#86EFAC', label: 'P25 (lower bound)', dash: true },
          { color: '#1A6B4A', label: 'Median',            dash: false },
          { color: '#FCD34D', label: 'P75 (upper bound)', dash: true },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <svg width="16" height="8">
              <line
                x1="0" y1="4" x2="16" y2="4"
                stroke={l.color}
                strokeWidth="2"
                strokeDasharray={l.dash ? '4 3' : undefined}
              />
            </svg>
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Data fetching function** (add to `lib/getLocalityData.ts`):

```typescript
export async function getLocalityTrend(slug: string): Promise<TrendPoint[]> {
  const supabase = createClient()

  // Fetch submissions grouped by month
  const { data, error } = await supabase
    .from('submissions')
    .select('effective_monthly_cost, created_at')
    .eq('locality_slug', slug)
    .eq('is_approved', true)
    .order('created_at', { ascending: true })

  if (error || !data || data.length === 0) return []

  // Group by month
  const byMonth = new Map<string, number[]>()
  data.forEach(row => {
    const date = new Date(row.created_at)
    const key = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    if (!byMonth.has(key)) byMonth.set(key, [])
    byMonth.get(key)!.push(row.effective_monthly_cost)
  })

  // Compute percentiles per month
  return Array.from(byMonth.entries())
    .filter(([, vals]) => vals.length >= 3) // need ≥3 to be meaningful
    .map(([month, vals]) => {
      const sorted = [...vals].sort((a, b) => a - b)
      const n = sorted.length
      return {
        month,
        median: Math.round(sorted[Math.floor(n * 0.5)]),
        p25:    Math.round(sorted[Math.floor(n * 0.25)]),
        p75:    Math.round(sorted[Math.floor(n * 0.75)]),
        count:  n,
      }
    })
}
```

Add the trend chart to the locality page below the BHK breakdown, wrapped in Suspense.

---

### MICROTASK 12.2 — Locality watchlist / email alert system

This lets users subscribe to a locality and receive an email when new rents are submitted.
This is the retention mechanism HydRent needs.

**Step 1 — Create `watchlists` table in Supabase**:
```sql
CREATE TABLE watchlists (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email        text NOT NULL,
  locality_slug text NOT NULL,
  bhk_filter   int[],          -- optional: only alert for specific BHKs
  max_rent     numeric,        -- optional: only alert if rent ≤ this
  is_confirmed boolean DEFAULT false,
  confirm_token text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(email, locality_slug)
);

CREATE INDEX idx_watchlists_locality ON watchlists(locality_slug);
```

**Step 2 — Create `app/api/watchlist/subscribe/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  const { email, locality_slug, bhk_filter, max_rent } = await req.json()

  if (!email || !locality_slug) {
    return NextResponse.json({ error: 'Email and locality required' }, { status: 400 })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const supabase = createClient()
  const confirmToken = randomBytes(32).toString('hex')

  const { error } = await supabase
    .from('watchlists')
    .upsert({
      email,
      locality_slug,
      bhk_filter: bhk_filter ?? null,
      max_rent: max_rent ?? null,
      is_confirmed: false,
      confirm_token: confirmToken,
    }, { onConflict: 'email,locality_slug' })

  if (error) {
    return NextResponse.json({ error: 'Failed to save watchlist' }, { status: 500 })
  }

  // TODO: Send confirmation email via Resend/SendGrid
  // For now, log the confirm URL
  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/watchlist/confirm?token=${confirmToken}`
  console.log('Confirm URL:', confirmUrl)

  return NextResponse.json({ success: true, message: 'Check your email to confirm your watchlist alert.' })
}
```

**Step 3 — Create `WatchlistWidget` component** (add to locality pages, in the sidebar):

```tsx
// components/WatchlistWidget.tsx
'use client'
import { useState } from 'react'

interface Props {
  localitySlug: string
  localityName: string
}

export function WatchlistWidget({ localitySlug, localityName }: Props) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubscribe() {
    if (!email.includes('@')) { setError('Enter a valid email'); return }
    setState('loading')
    try {
      const res = await fetch('/api/watchlist/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locality_slug: localitySlug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState('success')
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="card-static p-4 text-center">
        <div className="text-2xl mb-2">📬</div>
        <p className="font-medium text-sm">You're on the watchlist</p>
        <p className="text-text-secondary text-xs mt-1">
          We'll email you when new rents are submitted for {localityName}.
        </p>
      </div>
    )
  }

  return (
    <div className="card-static p-4">
      <h4 className="font-semibold text-sm mb-1">Watch {localityName}</h4>
      <p className="text-text-secondary text-xs mb-3 leading-relaxed">
        Get notified when new verified rents are submitted here.
      </p>
      <div className="flex flex-col gap-2">
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="your@email.com"
          className="input h-10 text-sm"
        />
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <button
          onClick={handleSubscribe}
          disabled={state === 'loading'}
          className="btn-secondary text-sm h-10 justify-center"
        >
          {state === 'loading' ? 'Saving...' : 'Alert me →'}
        </button>
      </div>
      <p className="text-text-tertiary text-xs mt-2 text-center">
        No spam · Unsubscribe anytime
      </p>
    </div>
  )
}
```

Add `<WatchlistWidget>` to the right sidebar of every locality page.

---

### MICROTASK 12.3 — Shareable rent card (og:image per locality)

When a user shares `/hyderabad/bachupally` on WhatsApp or Twitter, the preview image
should show a branded card with the median rent. Implement with Next.js dynamic og images.

**Create `app/hyderabad/[locality]/opengraph-image.tsx`**:

```tsx
import { ImageResponse } from 'next/og'
import { getLocalityData } from '@/lib/getLocalityData'
import { slugToName } from '@/lib/zones'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function LocalityOgImage({
  params,
}: {
  params: { locality: string }
}) {
  const data = await getLocalityData(params.locality)
  const name = slugToName(params.locality)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#FAFAF8',
          display: 'flex',
          flexDirection: 'column',
          padding: '64px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background dot pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(26,26,24,0.06) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div
            style={{
              width: 36, height: 36,
              background: '#1A6B4A',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 16,
            }}
          >
            H
          </div>
          <span style={{ fontSize: 22, fontWeight: 600, color: '#1A1A18' }}>HydRent</span>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 20, color: '#6B6B63', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {name}, Hyderabad
          </div>

          <div style={{ fontSize: 80, fontWeight: 700, color: '#1A1A18', lineHeight: 1, marginBottom: 16 }}>
            {data?.median
              ? `₹${data.median.toLocaleString('en-IN')}`
              : 'Submit yours'
            }
          </div>

          <div style={{ fontSize: 22, color: '#6B6B63', marginBottom: 32 }}>
            {data?.median
              ? 'Trust-weighted median monthly rent'
              : `Be the first to submit rent data for ${name}`
            }
          </div>

          {data && (
            <div style={{ display: 'flex', gap: 32 }}>
              <div>
                <div style={{ fontSize: 14, color: '#9C9B93', marginBottom: 4 }}>P25</div>
                <div style={{ fontSize: 28, fontWeight: 600, color: '#16A34A' }}>
                  ₹{data.p25.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: '#9C9B93', marginBottom: 4 }}>P75</div>
                <div style={{ fontSize: 28, fontWeight: 600, color: '#CA8A04' }}>
                  ₹{data.p75.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: '#9C9B93', marginBottom: 4 }}>Submissions</div>
                <div style={{ fontSize: 28, fontWeight: 600, color: '#1A1A18' }}>
                  {data.submissionCount}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1px solid rgba(26,26,24,0.10)' }}>
          <span style={{ fontSize: 16, color: '#9C9B93' }}>hydrent.vercel.app</span>
          <span style={{ fontSize: 16, color: '#9C9B93' }}>Community-verified rent data · No broker quotes</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
```

Also create a homepage og image at `app/opengraph-image.tsx` using the same pattern but
showing city-wide stats instead of locality-level.

---

## MICROTASK GROUP 13 — COPY AND CONTENT AUDIT

The AI must audit and fix ALL user-facing copy on the site. The current copy is
inconsistent, sometimes technical, and occasionally broken.

### MICROTASK 13.1 — Homepage copy

**Hero headline options** (pick one, must be on brand):
- "What your neighbours actually pay" ← recommended
- "The rent your broker doesn't want you to know"
- "Hyderabad rents, verified by renters"

**Hero subtext** (below the headline):
```
Community-verified rent data from real renters in Hyderabad — not broker quotes,
not inflated listing prices. P25/P75 ranges give you the negotiation anchor
you need before signing your lease.
```

**Section: How it works** (below the hero, 3-step):
```
Step 1 — Renters like you submit
Anonymous, takes 90 seconds. Just locality, BHK, rent, and furnishing type.

Step 2 — We weight by trust
Closed deals count more than asking rents. Verified proof files get extra weight.
Anomaly detection flags outliers.

Step 3 — You negotiate with data
Check the P25 before you call the broker. That number is your opening offer.
```

---

### MICROTASK 13.2 — Submit form copy

**Form title**: "Submit your rent"
**Form subtitle**: "Anonymous · 90 seconds · Helps hundreds of Hyderabad renters"

**Field labels** (exact copy):
- Locality: "Where is the flat?"
- Micro-locality: "Landmark or sub-area (optional)"
- BHK: "How many bedrooms?"
- Rent type: "How did this rent come about?"
  - Closed deal: "Closed deal — I actually pay this"
  - Renewal: "Renewal — continuing my existing lease"
  - Asking rent: "Asking rent — I've seen this quoted"
- Monthly rent: "Monthly rent (₹)"
- Maintenance: "Maintenance charges"
  - Toggle: "Included in rent" / "Charged separately"
- Deposit: "Security deposit (₹) — optional"
- Area: "Super built-up area (sq ft) — optional"
- Furnishing: "Furnishing type"
  - Furnished / Semi-furnished / Unfurnished
- Move-in date: "When did this rent start?"
- Occupancy: "Who is renting? — optional"
  - Family / Bachelor / Single professional

**Privacy note** (above submit button, exact copy):
```
🔒  What's public: locality, BHK, rent, furnishing type.
    What stays private: your exact address, proof files, personal details.
    Your landlord cannot identify you from this data.
```

---

### MICROTASK 13.3 — Locality page copy

**Confidence score explanation** (shown in the stat hero):
```
This score reflects how many submissions are verified closed deals,
how recent the data is, and how consistent it is across submissions.
Higher is more reliable. → How we score data
```

**BHK table caption**:
```
Breakdown by bedroom count · Based on {N} verified submissions
```

**Negotiation guide intro**:
```
Real data you can use in your next negotiation.
The P25 is your opening offer. The median is fair market.
Above the P75 and you should push back.
```

**Empty state for BHK with no data**:
```
No {N}BHK data yet for this locality.
→ Submit a {N}BHK rent and help future renters
```

---

### MICROTASK 13.4 — Error and edge case copy

Every error state must use clear, human copy — no technical errors shown to users.

| Situation | Copy to show |
|-----------|--------------|
| Locality page fails to load data | "Couldn't load rent data right now. Please refresh the page." |
| Submit form Supabase error | "Couldn't save your submission. Please try again in a moment." |
| Compare page with one locality missing data | "Not enough data for {localityName} yet. Try comparing with another locality." |
| /localities Supabase error | "Couldn't load localities. Please refresh." |
| Watchlist subscribe error | "Couldn't save your alert. Please try again." |
| Network offline | "You appear to be offline. Check your connection and try again." |
| Rate limit (if implemented) | "Too many submissions from this device. Try again tomorrow." |

To detect offline state and show a banner, add to `app/layout.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'

function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  useEffect(() => {
    const on  = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  if (!offline) return null
  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-amber-500 text-white text-sm text-center py-2 px-4">
      You're offline — some data may be unavailable
    </div>
  )
}
```

---

## FINAL MASTER CHECKLIST

Before pushing the final commit, tick every item:

### Critical bug fixes
- [ ] All canonical URLs use `https://hydrent.vercel.app/[path]` — no localhost
- [ ] All og:url use `https://hydrent.vercel.app/[path]` — no localhost
- [ ] Single nav component used across all pages
- [ ] Nav links: Localities → `/localities`, Compare → `/compare`, How it works → `/how-data-works`
- [ ] `/hyderabad/gachibowli` and other homepage-linked pages either have data or show EmptyState
- [ ] No page renders "₹0" or "₹0 to ₹0" anywhere
- [ ] No raw timestamp dump at the bottom of locality pages
- [ ] Submit form has loading / success / error states
- [ ] Submit form validates all required fields with inline errors
- [ ] Effective monthly cost auto-calculates from rent + maintenance inputs
- [ ] /issues form submits to Supabase and shows confirmation
- [ ] Homepage city signal reads from real database, not hardcoded values
- [ ] Compare dropdown navigates to correct route on click

### SEO and metadata
- [ ] `sitemap.xml` accessible at `/sitemap.xml`
- [ ] `robots.txt` accessible at `/robots.txt`
- [ ] Every page has unique `<title>` tag
- [ ] Every page has unique `<meta name="description">`
- [ ] Every locality page has locality-specific og:image
- [ ] Zero occurrences of "localhost" in page source

### UI/UX design
- [ ] Instrument Serif loaded and used on all hero numbers and headings
- [ ] JetBrains Mono used on all rent amounts
- [ ] Trust score badges are colour-coded (green/amber/red)
- [ ] All locality cards show trust bar (not just raw number)
- [ ] /localities has working search filter
- [ ] /localities has working zone filter
- [ ] Trust scores differ meaningfully between localities (not all 100/100)
- [ ] Skeleton loaders show on all async data sections
- [ ] Toasts show on submit success and error
- [ ] Footer is clean (no duplicate nav links)

### New features
- [ ] BHK sub-pages work (`/hyderabad/bachupally/2bhk`)
- [ ] Negotiation guide shows on BHK sub-pages
- [ ] "Is this rent fair?" calculator works
- [ ] Trend chart shows on locality pages (or graceful "not enough data" state)
- [ ] Watchlist widget shows in locality page sidebar
- [ ] Zone badges show on all locality cards and pages
- [ ] og:image dynamic for locality pages (shows median rent)

### Accessibility
- [ ] All form inputs have associated `<label>` elements
- [ ] All icon-only buttons have `aria-label`
- [ ] Focus styles visible on all interactive elements
- [ ] Skip to content link in layout
- [ ] BHK table has `scope="col"` on header cells
- [ ] Hamburger button opens accessible drawer on mobile

### Performance
- [ ] `generateStaticParams()` on all `[locality]` and `[comparison]` pages
- [ ] `export const revalidate = 3600` on locality and compare pages
- [ ] No `SELECT *` in any Supabase query
- [ ] React `cache()` wrapping repeated data-fetching functions
- [ ] Lighthouse SEO score ≥ 95 on live URL

### Mobile
- [ ] Nav hamburger opens/closes correctly
- [ ] No horizontal scroll on any page at 375px width
- [ ] Submit form inputs trigger numeric keyboard on mobile
- [ ] Locality page sidebar stacks below main content on mobile
- [ ] All tap targets ≥ 44px height

---

*END OF COMPLETE PROMPT.*
*Total microtask groups: 13*
*Total individual microtasks: 43*
*Total checklist items: 52*
*Estimated implementation: 2 focused sessions*
*Final deliverable: production-grade, deployed, SEO-ready, accessible HydRent
with full UI redesign, negotiation intelligence layer, and zero known bugs.*
