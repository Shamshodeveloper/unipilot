import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // File content is limited to 20 MB in the route; allow multipart overhead.
  experimental: { proxyClientMaxBodySize: "22mb" },
};

export default nextConfig;
