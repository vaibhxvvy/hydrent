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
        <div className="mb-6 rounded-lg border border-[var(--md-sys-color-primary)]/30 bg-[var(--md-sys-color-surface-container-high)] p-4 text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Submission queued for trust scoring and community validation.
        </div>
      )}
      {status === "invalid" && (
        <div className="mb-6 rounded-lg border border-[var(--md-sys-color-tertiary)]/30 bg-[var(--md-sys-color-surface-container-high)] p-4 text-sm text-[var(--md-sys-color-tertiary)]">
          Some required fields were missing or outside expected ranges.
        </div>
      )}
      <SubmissionForm />
    </div>
  );
}
