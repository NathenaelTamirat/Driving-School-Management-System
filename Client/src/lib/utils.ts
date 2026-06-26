// Utility functions shared across the client.
// The `cn()` helper merges Tailwind class strings with conflict resolution,
// combining `clsx` (conditional class joining) with `tailwind-merge`
// (intelligent deduplication of competing Tailwind utilities).
// This is the standard pattern used by shadcn/ui and most Tailwind projects.

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
