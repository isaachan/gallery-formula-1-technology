// Tiny zero-dependency static file server for the exported app (out/).
// Replaces `next start`, which isn't available under `output: "export"`.
// Serves ./out on http://localhost:3000 by default. Override via CLI flags
// (--port, --hostname, --root) or env vars (PORT, HOSTNAME, ROOT); flags win.
//
// Applies gzip content-encoding when the client advertises support, so the
// local performance audit (Lighthouse via verify-route-performance.mjs) sees
// transfer sizes comparable to what a production CDN/Vercel would ship. Without
// this, every route fails the script-bytes budget purely because of missing
// compression — a false negative relative to real hosting.
import { createServer } from "node:http";
import { createGzip } from "node:zlib";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

function argFlag(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const ROOT = argFlag("root") ?? process.env.ROOT ?? join(process.cwd(), "out");
const PORT = Number(argFlag("port") ?? process.env.PORT ?? 3000);
const HOSTNAME = argFlag("hostname") ?? process.env.HOSTNAME ?? "localhost";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

// Content types worth gzip-encoding (text-like and large). Binary image/font
// formats are already compressed at the codec level and are skipped.
const GZIP_TYPES = new Set([
  ".html",
  ".js",
  ".mjs",
  ".css",
  ".json",
  ".svg",
  ".txt",
  ".map",
]);

function acceptsGzip(req) {
  const header = req.headers["accept-encoding"];
  return typeof header === "string" && header.toLowerCase().includes("gzip");
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    // Strip trailing slash (except root) so "/cars/x/" -> "/cars/x/index.html".
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    let filePath = normalize(join(ROOT, pathname));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    let isDir = false;
    try {
      isDir = (await stat(filePath)).isDirectory();
    } catch {
      // fall through to .html / 404 handling
    }
    if (isDir) {
      filePath = join(filePath, "index.html");
    } else if (!extname(filePath)) {
      // Bare path like /cars/x -> try folder index, then .html.
      try {
        if ((await stat(join(filePath, "index.html"))).isFile()) {
          filePath = join(filePath, "index.html");
        } else {
          filePath += ".html";
        }
      } catch {
        filePath += ".html";
      }
    }

    const body = await readFile(filePath);
    const contentType = MIME[extname(filePath)] ?? "application/octet-stream";
    const shouldGzip = GZIP_TYPES.has(extname(filePath)) && acceptsGzip(req);
    if (shouldGzip) {
      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Encoding": "gzip",
        Vary: "Accept-Encoding",
      });
      const encoder = createGzip();
      encoder.pipe(res);
      encoder.end(body);
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    }
  } catch {
    // SPA-style fallback to the nearest 404 page if present.
    try {
      const fallback = await readFile(join(ROOT, "404.html"));
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(fallback);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  }
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`Serving ${ROOT} at http://${HOSTNAME}:${PORT}`);
});
