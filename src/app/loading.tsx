import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <Card key={item}>
          <CardContent className="p-5">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="mt-5 h-8 w-32 rounded bg-muted" />
            <div className="mt-4 h-3 w-full rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
