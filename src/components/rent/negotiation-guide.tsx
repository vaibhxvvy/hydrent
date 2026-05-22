"use client";

import { formatINR } from "@/lib/utils";

interface BHKStats {
  bhk: string;
  count: number;
  minRent: number;
  maxRent: number;
  medianRent: number | null;
}

interface Props {
  locality: string;
  bhk: string;
  stats: BHKStats | null;
  submissionCount: number;
}

export function NegotiationGuide({ locality, bhk, stats, submissionCount }: Props) {
  if (!stats || !stats.medianRent || submissionCount < 3) {
    return (
      <section className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-6 mt-6">
        <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-1">Negotiation guide</h2>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Not enough data yet for a personalised guide. Be the first to submit a {bhk} rent in {locality}.
        </p>
      </section>
    );
  }

  const anchorPrice = stats.minRent;
  const fairPrice = stats.medianRent;
  const overpaying = stats.maxRent;

  return (
    <section className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-6 mt-6">
      <h2 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-1">Negotiation guide</h2>
      <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-5">
        Use verified rent data to negotiate from a position of knowledge.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-[--radius-md] bg-[var(--md-sys-color-primary)]/10 border border-[var(--md-sys-color-primary)]/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-primary)] mb-1">Opening offer</p>
          <p className="font-mono text-2xl font-bold text-[var(--md-sys-color-primary)]">{formatINR(anchorPrice)}</p>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">Lowest verified. Start here.</p>
        </div>
        <div className="rounded-[--radius-md] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline)] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-1">Fair market</p>
          <p className="font-mono text-2xl font-bold text-[var(--md-sys-color-on-surface)]">{formatINR(fairPrice)}</p>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">Median of verified deals.</p>
        </div>
        <div className="rounded-[--radius-md] bg-[var(--md-sys-color-tertiary)]/10 border border-[var(--md-sys-color-tertiary)]/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-tertiary)] mb-1">Walk away</p>
          <p className="font-mono text-2xl font-bold text-[var(--md-sys-color-tertiary)]">{formatINR(overpaying)}</p>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">Above this, reconsider.</p>
        </div>
      </div>

      <div className="rounded-[--radius-md] bg-[var(--md-sys-color-surface-container-high)] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2">What to say</p>
        <p className="text-sm text-[var(--md-sys-color-on-surface)] leading-relaxed italic">
          &ldquo;I&apos;ve seen verified data showing {bhk} rents in {locality} around {formatINR(fairPrice)}.
          I&apos;d like to start at {formatINR(anchorPrice)} — I&apos;m a reliable long-term tenant.&rdquo;
        </p>
      </div>

      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-3">
        Based on {submissionCount} verified submissions. Data updated as new rents come in.
      </p>
    </section>
  );
}
