import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // jsdom (used by @mozilla/readability for main-content extraction) relies
  // on dynamic requires that Next.js's bundler doesn't trace reliably —
  // bundling it produces a function that throws at runtime in Vercel's
  // serverless environment even though it works fine in local dev. Keeping
  // it as a real, unbundled dependency (loaded from node_modules at
  // request time, same as any plain Node script) avoids that.
  serverExternalPackages: ["jsdom", "@mozilla/readability"],
};

export default nextConfig;
