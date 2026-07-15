import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Produce a fully static site (out/) — no Node server needed. This lets the
  // app run from `npx serve out`, any static host, or be bundled into the iOS
  // app and loaded offline from the filesystem.
  output: "export",
  // Emit each route as <slug>/index.html so the iOS WebView can resolve every
  // path to a file without a server doing path rewriting.
  trailingSlash: true,
  // No server-side image optimization in a static export.
  images: {
    unoptimized: true,
  },
  // Static export prerenders ~730 pages. On macOS the default worker pool
  // (one per CPU) opens more files than the file table allows at once, so
  // cap it to a small number of workers to avoid ENFILE during export.
  experimental: {
    workerThreads: false,
    cpus: 2,
  },
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
