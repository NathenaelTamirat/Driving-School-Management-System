// Theme provider wrapping next-themes for light/dark mode support.
// Renders the <ThemeProvider> at the app root (src/app/layout.tsx) with
// `attribute="class"` so Tailwind's dark: variant toggles via the <html>
// class. `defaultTheme="system"` respects the OS-level preference, and
// `disableTransitionOnChange` prevents a brief flash during theme switching.

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={["light", "dark"]}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
