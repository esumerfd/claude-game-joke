const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = 7331;
const STATIC_DIR = path.join(__dirname, "static");

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const sessions = new Map();

function getSession(req, res) {
  const cookies = (req.headers.cookie || "")
    .split(";")
    .reduce((acc, cookie) => {
      const [key, val] = cookie.trim().split("=");
      if (key && val) acc[key] = val;
      return acc;
    }, {});

  let sessionId = cookies.session_id;
  if (!sessionId || !sessions.has(sessionId)) {
    sessionId = crypto.randomUUID();
    sessions.set(sessionId, { stage: 1, startedAt: Date.now() });
  }

  res.setHeader(
    "Set-Cookie",
    `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax`
  );
  return sessions.get(sessionId);
}

function serveStatic(res, filePath) {
  const ext = path.extname(filePath);
  const mime = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Add the suspicious header to every response (red herring)
  res.setHeader("X-Puzzle-Key", "5a6f6e6b");

  const session = getSession(req, res);

  // API routes
  if (pathname === "/api/session") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ stage: session.stage }));
    return;
  }

  if (pathname === "/api/session/advance" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const nextStage = session.stage + 1;
      if (nextStage <= 7) {
        session.stage = nextStage;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ stage: session.stage }));
    });
    return;
  }

  // Serve index.html for root
  if (pathname === "/" || pathname === "/index.html") {
    serveStatic(res, path.join(STATIC_DIR, "index.html"));
    return;
  }

  // Serve static files
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  serveStatic(res, path.join(STATIC_DIR, safePath));
});

server.listen(PORT, () => {
  console.log(`\n  🃏 Claude Game: The Joke`);
  console.log(`  ========================`);
  console.log(`  Server running at http://localhost:${PORT}`);
  console.log(`  Point Claude at the URL above and start hunting.\n`);
});
