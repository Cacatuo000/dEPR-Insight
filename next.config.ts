import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["192.168.1.141", "192.168.1.*", "192.168.0.*"],
};

export default nextConfig;
