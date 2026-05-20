import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Issue type for rendering
interface Issue {
  id: string;
  subject: string;
  message: string;
  name: string | null;
  email: string | null;
  createdAt: Date;
}

export const metadata: Metadata = {
  title: "Issue Reports",
  description: "View and manage issue reports from users",
};

export default async function IssuesAdminPage() {
  // Fetch actual issues from the database
  let issues: Issue[] = [];
  try {
    const { getPrisma } = await import("@/lib/db");
    const prisma = getPrisma();
    issues = await prisma.issueReport.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch {
    // If DB is not available (e.g. static build), show no issues
    issues = [];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Issue Reports</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Manage and track user-submitted issue reports
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Issue Reports</CardTitle>
          <CardDescription>
            List of issues reported by users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No issue reports yet.
                  </TableCell>
                </TableRow>
              )}
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{issue.subject}</p>
                      <p className="text-sm text-muted-foreground">{issue.message.substring(0, Math.min(50, issue.message.length))}...</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{issue.name || "Anonymous"}</p>
                      <p className="text-sm text-muted-foreground">{issue.email || "No email provided"}</p>
                    </div>
                  </TableCell>
                  <TableCell>{issue.createdAt.toISOString().split('T')[0]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button disabled>Export Issues</Button>
      </div>
    </div>
  );
}
