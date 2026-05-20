import Link from "next/link";
import { Mail, Github } from "lucide-react";

const links = [
  { href: "/how-data-works", label: "How data works" },
  { href: "/submit", label: "Submit rent" },
  { href: "/issues", label: "Report an issue" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-dim)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[var(--md-sys-color-primary)] text-xs font-bold text-[var(--md-sys-color-on-primary)]">
              H
            </span>
            <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">HydRent</p>
          </div>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--md-sys-color-on-surface-variant)]">
            Open source · Built for Hyderabad renters · No broker quotes, no inflated listing prices.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="mailto:labusepc@gmail.com?subject=Website%20Issue%20Report"
              className="inline-flex items-center gap-2 rounded-[--radius-button] border border-[var(--md-sys-color-outline)] px-3 py-1.5 text-sm text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
            >
              <Mail className="size-4" />
              Report an Issue
            </a>
            <Link
              href="/issues"
              className="inline-flex items-center gap-2 rounded-[--radius-button] border border-[var(--md-sys-color-outline)] px-3 py-1.5 text-sm text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
            >
              <Github className="size-4" />
              Submit Feedback
            </Link>
          </div>
        </div>
        <nav className="grid gap-2 text-sm" aria-label="Footer navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-[var(--md-sys-color-outline)]">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] sm:px-6">
          Open source · Built for Hyderabad renters · hydrent.vercel.app
        </div>
      </div>
    </footer>
  );
}
