// Root layout wrapper for the authenticated dashboard area.
// Composes Sidebar (left nav) + Header (top bar) + scrollable <main> content
// into a full-height flex layout. The outer container uses h-screen overflow-hidden
// so only the main area scrolls (sidebar and header stay fixed).
// Used in src/app/(dashboard)/layout.tsx as the layout component for all
// routes under the (dashboard) route group.

import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-6 text-foreground md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
