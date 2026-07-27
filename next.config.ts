import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@azure/monitor-opentelemetry"],
};

export default nextConfig;
