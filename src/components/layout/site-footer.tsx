import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--md-sys-color-outline)] mt-20 bg-[var(--md-sys-color-surface-dim)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 font-display text-xl font-semibold text-[var(--md-sys-color-on-surface)]">
            <ShieldCheck className="size-5 text-[var(--md-sys-color-primary)]" />
            HydRent
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
            Community-verified rent intelligence for Hyderabad.
            Open source. No broker quotes. No ads.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-3">Data</h3>
          <div className="flex flex-col gap-2.5 text-sm">
            <Link href="/localities" className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors">All localities</Link>
            <Link href="/compare" className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors">Compare localities</Link>
            <Link href="/how-data-works" className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors">How data works</Link>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-3">Contribute</h3>
          <div className="flex flex-col gap-2.5 text-sm">
            <Link href="/submit" className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors">Submit your rent</Link>
            <Link href="/issues" className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors">Report an issue</Link>
            <a href="https://github.com/vaibhxvvy/hydrent" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors">
              GitHub <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--md-sys-color-outline)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          <span>© 2025 HydRent · Open source civic tech</span>
          <span>Data from real renters, not brokers</span>
        </div>
      </div>
    </footer>
  );
}
