// Tiny zero-dependency static file server for the exported app (out/).
// Replaces `next start`, which isn't available under `output: "export"`.
// Serves ./out on http://localhost:3000 by default. Override via CLI flags
// (--port, --hostname, --root) or env vars (PORT, HOSTNAME, ROOT); flags win.
import { createServer } from "node:http";
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
    res.writeHead(200, {
      "Content-Type": MIME[extname(filePath)] ?? "application/octet-stream",
    });
    res.end(body);
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
