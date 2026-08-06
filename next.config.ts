import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allows external images from any HTTPS domain
      },
    ],
  },
};

export default nextConfig;