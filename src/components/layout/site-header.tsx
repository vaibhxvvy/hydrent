"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/hyderabad/gachibowli", label: "Localities" },
  { href: "/compare/gachibowli-vs-kondapur", label: "Compare" },
  { href: "/how-data-works", label: "How it works" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#1f2b1f] bg-[#0a0f0a]/92 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-normal">
          <span className="size-2.5 rounded-full bg-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.4)]" />
          <span className="text-lg text-[#f0fdf4]">HydRent</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {nav.map((item) => (
            <Button asChild key={item.href} variant="ghost" size="sm" className="text-[#86efac] hover:text-[#f0fdf4] hover:bg-[#1a221a]">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="rounded-full bg-[#22c55e] text-[#0a0f0a] hover:bg-[#16a34a] px-5 hidden sm:inline-flex">
            <Link href="/submit">Submit rent</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-[#86efac]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-[#0a0f0a] border-t border-[#1f2b1f] md:hidden">
          <nav className="flex flex-col gap-2 p-6" aria-label="Mobile navigation">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-3 text-lg text-[#86efac] hover:bg-[#1a221a] hover:text-[#f0fdf4] transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 border-t border-[#1f2b1f] pt-4">
              <Button asChild size="lg" className="w-full rounded-full bg-[#22c55e] text-[#0a0f0a] hover:bg-[#16a34a]">
                <Link href="/submit" onClick={() => setMobileOpen(false)}>Submit rent</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
