import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="mt-5 text-2xl font-semibold tracking-normal">This rent report is not indexed yet</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        HydRent grows through verified community submissions. Try another locality or submit rent
        data for a Hyderabad market.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to city overview</Link>
      </Button>
    </section>
  );
}
