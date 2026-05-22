import Link from "next/link";

interface Props {
  locality: string;
}

export function LocalityEmptyState({ locality }: Props) {
  const name = locality
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--md-sys-color-surface-container-high)]">
        <svg className="size-8 text-[var(--md-sys-color-on-surface-variant)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      </div>
      <h1 className="mt-5 text-2xl font-bold text-[var(--md-sys-color-on-surface)]">
        No data yet for {name}
      </h1>
      <p className="mt-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
        Be the first renter to submit a verified rent for {name}. It takes 90 seconds and helps hundreds of future renters.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/submit"
          className="rounded-[--radius-button] bg-[var(--md-sys-color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-primary)] hover:brightness-110 transition-all"
        >
          Submit rent for {name}
        </Link>
        <Link
          href="/localities"
          className="rounded-[--radius-button] border border-[var(--md-sys-color-outline)] px-6 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all"
        >
          Browse localities
        </Link>
      </div>
    </div>
  );
}
