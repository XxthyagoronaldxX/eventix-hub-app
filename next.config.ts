import type { NextConfig } from "next";

const MAXIMUM_UPLOAD_SIZE = "12mb";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/payments/:eventId", destination: "/events/:eventId/payments", permanent: false },
      { source: "/check-in/:eventId", destination: "/events/:eventId/check-in", permanent: false },
      { source: "/draws/:eventId", destination: "/events/:eventId/draw", permanent: false },
      ...["/tickets", "/payments", "/check-in", "/draws"].map((source) => ({
        source,
        destination: "/events",
        permanent: false,
      })),
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: MAXIMUM_UPLOAD_SIZE,
    },
    proxyClientMaxBodySize: MAXIMUM_UPLOAD_SIZE,
  },
};

export default nextConfig;
