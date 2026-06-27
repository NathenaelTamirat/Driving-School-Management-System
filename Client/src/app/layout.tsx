// Root Next.js layout wrapping every page in the application.
// Sets up:
// 1. Geist Sans + Geist Mono fonts via next/font (variable CSS custom properties)
// 2. ThemeProvider (next-themes) for light/dark mode with system preference detection
// 3. Sonner Toaster for global toast notifications (top-right, rich colours)
// 4. HTML `suppressHydrationWarning` to avoid React warnings from next-themes
//    class toggling during SSR hydration
//
// Metadata sets the tab title and description for SEO/social sharing.

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DSAS — Driving School Admin",
  description: "Driving School Administration System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
