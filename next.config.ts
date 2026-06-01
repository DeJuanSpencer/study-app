import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["officeparser", "pdf-parse", "mammoth"],
};

export default nextConfig;
