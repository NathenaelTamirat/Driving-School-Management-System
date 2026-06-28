// Next.js configuration for the Driving School client application.
// Runs on Next.js 16 with Turbopack (the Rust-based dev server / bundler).
// The `root` option explicitly anchors Turbopack to the project root so
// that module resolution and cache paths are predictable regardless of
// how the dev script is launched.

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  transpilePackages: ["recharts", "victory-vendor", "d3-scale", "d3-array", "d3-interpolate", "d3-color", "d3-format", "d3-time", "d3-time-format", "d3-shape", "d3-path"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
