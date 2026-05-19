import Link from "next/link";

const links = [
  { href: "/how-data-works", label: "How data works" },
  { href: "/hyderabad/gachibowli", label: "Gachibowli rent" },
  { href: "/hyderabad/kondapur/2bhk", label: "2BHK in Kondapur" },
  { href: "/building/prestige-high-fields", label: "Prestige High Fields" },
  { href: "/compare/gachibowli-vs-kondapur", label: "Compare localities" },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-sm font-semibold">HydRent</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            An open-source civic-tech project for real rent intelligence in Hyderabad. Seed values
            are illustrative until connected to a verified Supabase/PostgreSQL dataset.
          </p>
        </div>
        <nav className="grid gap-2 text-sm" aria-label="Footer navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
