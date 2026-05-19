import Link from "next/link";
import { BarChart3, GitCompareArrows, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/hyderabad/gachibowli", label: "Localities" },
  { href: "/compare/gachibowli-vs-kondapur", label: "Compare" },
  { href: "/how-data-works", label: "Transparency" },
  { href: "/admin", label: "Moderation" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-normal">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BarChart3 className="size-4" aria-hidden="true" />
          </span>
          <span>HydRent</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {nav.map((item) => (
            <Button asChild key={item.href} variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/compare/gachibowli-vs-kondapur">
              <GitCompareArrows className="size-4" aria-hidden="true" />
              Compare
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/submit">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Submit rent
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
