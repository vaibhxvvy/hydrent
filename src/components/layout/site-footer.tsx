import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const links = [
  { href: "/how-data-works", label: "How data works" },
  { href: "/submit", label: "Submit rent" },
  { href: "/issues", label: "Report an issue" },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-sm font-semibold">HydRent</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Open source · Built for Hyderabad renters · No broker quotes, no inflated listing prices.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:labusepc@gmail.com?subject=Website%20Issue%20Report" className="inline-flex items-center">
                <Mail className="size-4 mr-2" aria-hidden="true" />
                Report an Issue
              </a>
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/issues" className="inline-flex items-center">
                <Mail className="size-4 mr-2" aria-hidden="true" />
                Submit Feedback
              </Link>
            </Button>
          </div>
        </div>
        <nav className="grid gap-2 text-sm" aria-label="Footer navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
          Open source · Built for Hyderabad renters · hydrent.vercel.app
        </div>
      </div>
    </footer>
  );
}
