// Layout for the (dashboard) route group.
// Wraps all dashboard pages (Dashboard home, Students list, etc.) inside
// the AppShell component which provides the sidebar, header, and scrollable
// main content area. Routes outside this group (e.g. /students/new) have
// their own full-screen layout without the shell.

import { AppShell } from "@/components/layout/app-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
