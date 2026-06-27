"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  clerk: "Clerk",
  instructor: "Instructor",
};

const roleBadgeVariant: Record<string, "default" | "secondary" | "success"> = {
  admin: "default",
  clerk: "secondary",
  instructor: "success",
};

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
          aria-label="Open menu"
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-foreground">
          Driving School Admin
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {user && (
          <>
            <span className="hidden text-sm font-medium text-foreground sm:inline">
              {user.full_name}
            </span>
            <Badge variant={roleBadgeVariant[user.role] ?? "secondary"}>
              {roleLabels[user.role] ?? user.role}
            </Badge>
          </>
        )}

        <button
          onClick={() =>
            setTheme(resolvedTheme === "dark" ? "light" : "dark")
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Toggle theme"
          type="button"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
