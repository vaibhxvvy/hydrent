import type { Metadata } from "next";
import { SubmissionForm } from "@/components/forms/submission-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.7fr_1.3fr]">
      <aside className="space-y-4">
        <div>
          <Badge variant="trust">Private verification</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal">Contribute a rent signal</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Closed rents and renewals help renters negotiate with better context. Asking rents are
            accepted but weighted lower until verified.
          </p>
        </div>
        {status === "queued" ? (
          <Card>
            <CardContent className="p-4 text-sm text-emerald-800">
              Submission queued for trust scoring and community validation.
            </CardContent>
          </Card>
        ) : null}
        {status === "invalid" ? (
          <Card>
            <CardContent className="p-4 text-sm text-amber-900">
              Some required fields were missing or outside expected ranges.
            </CardContent>
          </Card>
        ) : null}
      </aside>
      <SubmissionForm />
    </div>
  );
}
