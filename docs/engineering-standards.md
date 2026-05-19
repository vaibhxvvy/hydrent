# Engineering Standards

HydRent should feel handcrafted, maintainable, and reviewable.

## TypeScript

- Use strict TypeScript.
- Validate external input with Zod.
- Keep domain types in `src/lib/types.ts`.
- Prefer explicit return shapes for reusable analytics functions.

## React and Next.js

- Use Server Components by default.
- Push Client Components to the smallest interactive boundary.
- Keep route pages composed from domain functions and reusable components.
- Use dynamic metadata for SEO pages.
- Avoid initializing database or SDK clients at module scope.

## UI

- Use source-owned shadcn-style primitives.
- Keep layout calm, dense, readable, and mobile-first.
- Do not use decorative gradients, glassmorphism, or generic SaaS hero patterns.
- Prefer tables, cards, badges, tabs, charts, and clear empty states.

## Data

- Never publish individual tenant evidence.
- Prefer ranges and confidence over single-point claims.
- Label estimated, verified, and community-reviewed data.
- Preserve audit trails.

## Commits

Use Conventional Commits:

```text
feat: add locality rent aggregation
fix: correct rent type weighting
docs: expand trust model explanation
```

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```
