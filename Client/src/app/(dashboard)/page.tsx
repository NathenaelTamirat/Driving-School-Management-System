// Dashboard home page — the root route of the authenticated area.
// Currently a simple landing page with a page title and a "New Student" CTA
// button that links to the enrollment wizard (/students/new). The dashboard
// will later display summary widgets (student counts, batch status, etc.).

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <Button asChild className="bg-primary hover:bg-primary/90" size="lg">
          <Link href="/students/new">
            <Plus className="h-4 w-4" />
            New Student
          </Link>
        </Button>
      </div>
    </div>
  );
}
