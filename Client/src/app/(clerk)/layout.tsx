"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";

export default function ClerkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (
      !isLoading &&
      (!user || (user.role !== "admin" && user.role !== "clerk"))
    ) {
      router.replace("/unauthorized");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || (user.role !== "admin" && user.role !== "clerk"))
    return null;

  return <AppShell>{children}</AppShell>;
}
