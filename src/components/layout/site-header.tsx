"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/localities", label: "Localities" },
  { href: "/compare", label: "Compare" },
  { href: "/how-data-works", label: "How it works" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-dim)]/92 backdrop-blur-lg">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-1.5 font-semibold tracking-tight text-lg text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] transition-colors">
          HydRent
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary navigation">
          {nav.map((item) => (
            <Button asChild key={item.href} variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex gap-1.5">
            <Link href="/submit">
              <Plus className="size-4" />
              Submit rent
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 top-14 z-50 bg-[var(--md-sys-color-surface-dim)] border-t border-[var(--md-sys-color-outline)] md:hidden">
          <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-[--radius-md] px-4 py-3 text-base text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-[var(--md-sys-color-outline)] pt-3">
              <Button asChild size="lg" className="w-full gap-1.5">
                <Link href="/submit" onClick={() => setMobileOpen(false)}>
                  <Plus className="size-4" />
                  Submit rent
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
