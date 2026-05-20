import type { Metadata } from "next";
import { SubmissionForm } from "@/components/forms/submission-form";
import { baseMetadata } from "@/lib/seo";

export const metadata: Metadata = baseMetadata({
  title: "Submit rent",
  description: "Submit a privacy-preserving Hyderabad rent signal for community verification.",
  alternates: { canonical: "/submit" },
});

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {status === "queued" && (
        <div className="mb-6 rounded-lg border border-[#22c55e]/30 bg-[#1a221a] p-4 text-sm text-[#86efac]">
          Submission queued for trust scoring and community validation.
        </div>
      )}
      {status === "invalid" && (
        <div className="mb-6 rounded-lg border border-[#eab308]/30 bg-[#1a221a] p-4 text-sm text-[#eab308]">
          Some required fields were missing or outside expected ranges.
        </div>
      )}
      <SubmissionForm />
    </div>
  );
}
