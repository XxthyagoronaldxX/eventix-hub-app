import type { NextConfig } from "next";

const MAXIMUM_UPLOAD_SIZE = "12mb";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: MAXIMUM_UPLOAD_SIZE,
    },
    proxyClientMaxBodySize: MAXIMUM_UPLOAD_SIZE,
  },
};

export default nextConfig;
