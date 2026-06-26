// Next.js configuration for the Driving School client application.
// Runs on Next.js 16 with Turbopack (the Rust-based dev server / bundler).
// The `root` option explicitly anchors Turbopack to the project root so
// that module resolution and cache paths are predictable regardless of
// how the dev script is launched.

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
