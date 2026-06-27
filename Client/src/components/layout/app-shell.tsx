"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-background p-6 text-foreground md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
