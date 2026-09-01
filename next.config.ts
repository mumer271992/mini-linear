import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma Client is generated to a custom path (src/generated/prisma), so
  // Next.js's output file tracing doesn't reliably auto-detect the native
  // query engine binary and skips copying it into the serverless bundle --
  // https://pris.ly/d/engine-not-found-nextjs
  outputFileTracingIncludes: {
    "/*": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;
