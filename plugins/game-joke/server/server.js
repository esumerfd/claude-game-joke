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
  ".txt": "text/plain",
};

const sessions = new Map();

const PUZZLE_TOKEN = Buffer.from(
  "Nice try. This cookie contains no secrets. Or does it? No. It doesn't."
).toString("base64");

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

  res.setHeader("Set-Cookie", [
    `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax`,
    `puzzle_token=${PUZZLE_TOKEN}; Path=/; SameSite=Lax`,
  ]);
  return sessions.get(sessionId);
}

function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data, null, 2));
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

// --- OpenAPI Spec ---

const OPENAPI_SPEC = {
  openapi: "3.0.3",
  info: {
    title: "Claude Game: The Joke",
    description: "API endpoints for the puzzle game server",
    version: "1.0.0",
  },
  paths: {
    "/api/word/{position}": {
      get: {
        summary: "Get a puzzle word by position",
        parameters: [
          {
            name: "position",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "The word position in the joke (1-indexed)",
          },
        ],
        responses: {
          200: {
            description: "The word at the given position",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    word: { type: "string" },
                    position: { type: "integer" },
                  },
                },
              },
            },
          },
          404: { description: "No word available at this position" },
        },
      },
    },
    "/api/quest": {
      get: {
        summary: "Seek wisdom on your journey",
        description:
          "Returns guidance for those brave enough to seek the truth.",
        responses: {
          200: {
            description: "Words of wisdom",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    verses: {
                      type: "array",
                      items: { type: "string" },
                    },
                    hint: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/session": {
      get: {
        summary: "Get current puzzle progress",
        responses: {
          200: {
            description: "Current session stage",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    stage: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

// --- Request Handler ---

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Red herring: suspicious header on every response
  res.setHeader("X-Puzzle-Key", "5a6f6e6b");

  const session = getSession(req, res);

  // --- API Routes ---

  // Session
  if (pathname === "/api/session") {
    jsonResponse(res, 200, { stage: session.stage });
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
      jsonResponse(res, 200, { stage: session.stage });
    });
    return;
  }

  // OpenAPI docs
  if (pathname === "/api/docs" || pathname === "/api/docs/") {
    jsonResponse(res, 200, OPENAPI_SPEC);
    return;
  }

  // Puzzle 2: word endpoint (only position 2 returns a real word)
  const wordMatch = pathname.match(/^\/api\/word\/(\d+)$/);
  if (wordMatch) {
    const position = parseInt(wordMatch[1], 10);
    if (position === 2) {
      jsonResponse(res, 200, { word: "volunteers", position: 2 });
    } else {
      jsonResponse(res, 404, {
        error: "No word available at this position",
        position,
      });
    }
    return;
  }

  // Red herring: the poet's endpoint
  if (pathname === "/api/quest") {
    jsonResponse(res, 200, {
      message: "A Seeker's Lament",
      verses: [
        "Beneath the darkening skies you wander still,",
        "Through oceans deep of code, with iron will.",
        "The answers hide where syntax fears to tread,",
        "In places lost, where lesser minds have fled.",
        "But hark! The truth was never in the deep\u2014",
        "It rests in plain sight, for the wise to reap.",
      ],
      hint: "Or does it?",
    });
    return;
  }

  // --- Special Files ---

  // Puzzle 4: robots.txt
  if (pathname === "/robots.txt") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(
      [
        "User-agent: *",
        "Disallow: /secret/",
        "",
        "# Cuarta palabra: evaporado",
      ].join("\n")
    );
    return;
  }

  // Red herring: the /secret/ directory
  if (pathname === "/secret" || pathname === "/secret/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<!DOCTYPE html>
<html><head><title>Secret Room</title>
<style>body{background:#0a0a0f;color:#c0c0c0;font-family:"Courier New",monospace;display:flex;justify-content:center;align-items:center;min-height:100vh;text-align:center;}
.room{max-width:500px;padding:2rem;}.room h1{color:#ff6ec7;margin-bottom:1rem;}</style></head>
<body><div class="room">
<h1>The Secret Room</h1>
<p>You found it! Unfortunately, it's empty.</p>
<p style="color:#666;margin-top:1rem;">The real secrets were the friends we made along the way.</p>
</div></body></html>`);
    return;
  }

  // --- Static Files ---

  if (pathname === "/" || pathname === "/index.html") {
    serveStatic(res, path.join(STATIC_DIR, "index.html"));
    return;
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  serveStatic(res, path.join(STATIC_DIR, safePath));
});

server.listen(PORT, () => {
  console.log(`\n  \u{1F0CF} Claude Game: The Joke`);
  console.log(`  ========================`);
  console.log(`  Server running at http://localhost:${PORT}`);
  console.log(`  Point Claude at the URL above and start hunting.\n`);
});
