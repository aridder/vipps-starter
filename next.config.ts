import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@azure/monitor-opentelemetry"],
};

export default nextConfig;
