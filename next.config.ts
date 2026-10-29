import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export a static site: no server routes, database or runtime secrets.
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
