import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Project ini punya lockfile sendiri; tanpa ini Next menebak root dari
  // lockfile milik folder induk dan memunculkan warning setiap `next start`.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
