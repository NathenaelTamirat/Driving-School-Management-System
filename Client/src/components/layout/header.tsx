// Dashboard header bar: theme toggle (light/dark) and admin avatar badge.
// Uses next-themes for hydration-safe theme switching — the Sun/Moon icon
// only renders after mount (mounted guard) to prevent hydration mismatch
// between server-rendered HTML and client-side theme detection.
// The "AD" badge is a static placeholder for the admin profile avatar.

"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="flex h-16 items-center justify-end gap-3 border-b border-border bg-card px-6">
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Toggle theme"
        type="button"
      >
        {mounted && resolvedTheme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>

      <div
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
        aria-label="Admin profile"
      >
        AD
      </div>
    </header>
  );
}
