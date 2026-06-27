"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (
      !loading &&
      (!user || (user.role !== "admin" && user.role !== "instructor"))
    ) {
      router.replace("/unauthorized");
    }
  }, [user, loading, router]);

  if (
    loading ||
    !user ||
    (user.role !== "admin" && user.role !== "instructor")
  )
    return null;

  return <AppShell>{children}</AppShell>;
}
