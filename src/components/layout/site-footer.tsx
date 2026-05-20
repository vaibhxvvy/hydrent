import Link from "next/link";
import { Mail } from "lucide-react";

const links = [
  { href: "/how-data-works", label: "How data works" },
  { href: "/submit", label: "Submit rent" },
  { href: "/issues", label: "Report an issue" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#1f2b1f] bg-[#0a0f0a]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-sm font-semibold text-[#f0fdf4]">HydRent</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#4b7a4b]">
            Open source · Built for Hyderabad renters · No broker quotes, no inflated listing prices.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="mailto:labusepc@gmail.com?subject=Website%20Issue%20Report"
              className="inline-flex items-center gap-2 rounded-lg border border-[#2d3f2d] px-3 py-1.5 text-sm text-[#86efac] hover:bg-[#1a221a] transition-colors"
            >
              <Mail className="size-4" />
              Report an Issue
            </a>
            <Link
              href="/issues"
              className="inline-flex items-center gap-2 rounded-lg border border-[#2d3f2d] px-3 py-1.5 text-sm text-[#86efac] hover:bg-[#1a221a] transition-colors"
            >
              <Mail className="size-4" />
              Submit Feedback
            </Link>
          </div>
        </div>
        <nav className="grid gap-2 text-sm" aria-label="Footer navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-[#4b7a4b] hover:text-[#86efac] transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-[#1f2b1f]">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-[#4b7a4b] sm:px-6">
          Open source · Built for Hyderabad renters · hydrent.vercel.app
        </div>
      </div>
    </footer>
  );
}
