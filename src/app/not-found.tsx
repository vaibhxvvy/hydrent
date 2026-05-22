import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <SearchX className="size-10 text-[#4b7a4b]" aria-hidden="true" />
      <h1 className="mt-5 text-2xl font-bold text-[#f0fdf4]">This rent report is not indexed yet</h1>
      <p className="mt-3 text-sm leading-6 text-[#86efac]">
        HydRent grows through verified community submissions. Try another locality or submit rent data for a Hyderabad market.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-full bg-[#14B8A6] px-5 py-2.5 text-sm font-medium text-[#0a0f0a] hover:bg-[#0D9488] transition-colors"
      >
        Back to city overview
      </Link>
    </section>
  );
}
