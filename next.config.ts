import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Lets a phone on the same LAN connect to the dev server's HMR/webpack
  // channel when testing via `npm run dev`'s "Network" URL — without this,
  // Next.js silently blocks that cross-origin request and the device never
  // receives live code updates, so refreshing on it looks like a no-op.
  allowedDevOrigins: ["192.168.1.13"],
};

export default nextConfig;
