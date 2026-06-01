import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["officeparser", "pdf-parse", "mammoth", "@tavily/core"],
};

export default nextConfig;
