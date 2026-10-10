import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: (process.env.NEXT_OUTPUT as "export" | "standalone") || "standalone",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;