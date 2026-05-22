import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--md-sys-color-outline)] mt-20 bg-[var(--md-sys-color-surface-dim)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="font-semibold text-lg text-[var(--md-sys-color-on-surface)]">HydRent</div>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-2 leading-relaxed">
            Community-verified rent intelligence for Hyderabad.
            Open source. No broker quotes. No ads.
          </p>
        </div>
        <div>
          <div className="text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-3">Data</div>
          <div className="flex flex-col gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
            <Link href="/localities" className="hover:text-[var(--md-sys-color-on-surface)] transition-colors">All localities</Link>
            <Link href="/compare" className="hover:text-[var(--md-sys-color-on-surface)] transition-colors">Compare localities</Link>
            <Link href="/how-data-works" className="hover:text-[var(--md-sys-color-on-surface)] transition-colors">How data works</Link>
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-3">Contribute</div>
          <div className="flex flex-col gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
            <Link href="/submit" className="hover:text-[var(--md-sys-color-on-surface)] transition-colors">Submit your rent</Link>
            <Link href="/issues" className="hover:text-[var(--md-sys-color-on-surface)] transition-colors">Report an issue</Link>
            <a href="https://github.com/vaibhxvvy/hydrent" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-[var(--md-sys-color-on-surface)] transition-colors">
              GitHub <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-[var(--md-sys-color-outline)] flex flex-wrap justify-between items-center gap-4 text-xs text-[var(--md-sys-color-on-surface-variant)]">
        <span>© 2025 HydRent · Open source civic tech</span>
        <span>Data from real renters, not brokers</span>
      </div>
    </footer>
  );
}
