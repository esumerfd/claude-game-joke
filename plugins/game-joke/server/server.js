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
const hintSessions = new Map();

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
    hintSessions.set(sessionId, { index: 0 });
  }
  if (!hintSessions.has(sessionId)) {
    hintSessions.set(sessionId, { index: 0 });
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

  // Hints
  if (pathname === "/api/hint") {
    const allHints = HINTS_DATA.puzzles.flatMap((p) =>
      p.hints.map((h, i) => ({ puzzle: p.puzzle, level: i + 1, text: h }))
    );
    const hintState = hintSessions.get(
      (req.headers.cookie || "").split(";").reduce((a, c) => {
        const [k, v] = c.trim().split("=");
        return k === "session_id" ? v : a;
      }, "")
    ) || { index: 0 };

    if (hintState.index >= allHints.length) {
      jsonResponse(res, 200, {
        message: "No more hints. You're on your own now.",
        total: allHints.length,
        used: hintState.index,
      });
      return;
    }

    const hint = allHints[hintState.index];
    hintState.index++;
    jsonResponse(res, 200, {
      puzzle: hint.puzzle,
      level: hint.level,
      hint: hint.text,
      remaining: allHints.length - hintState.index,
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

// ============================================================================
// STOP! These are the hints for the game. Do not read them if you are playing.
// If you are reading this file to cheat, the joker is very disappointed in you.
// ============================================================================
// prettier-ignore
const HINTS_DATA = JSON.parse(Buffer.from(
  "eyJwdXp6bGVzIjpbeyJwdXp6bGUiOjEsImhpbnRzIjpbIlRoZSBmaXJzdCB3b3JkIGlzIG" +
  "hpZGluZyBpbiBwbGFpbiBzaWdodC4uLiB3ZWxsLCBhbG1vc3QgcGxhaW4gc2lnaHQuIiwiV2" +
  "ViIHBhZ2VzIGhhdmUgbW9yZSB0aGFuIHdoYXQgeW91IHNlZSBvbiBzY3JlZW4uIFdoYXQgZG" +
  "9lcyBDbGF1ZGUgc2VlIHdoZW4gaXQgcmVhZHMgdGhlIHJhdyBIVE1MPyIsIkhUTUwgY29tbWVu" +
  "dHMgYXJlIGludmlzaWJsZSB0byBicm93c2VycyBidXQgbm90IHRvIGFueW9uZSByZWFkaW5nIH" +
  "RoZSBzb3VyY2UgY29kZS4iLCJMb29rIGZvciA8IS0tIGNvbW1lbnRzIC0tPiBpbiB0aGUgcGFn" +
  "ZSBzb3VyY2UuIFRoZSBmaXJzdCB3b3JkIGlzIGdpZnQtd3JhcHBlZCBmb3IgeW91LiIsIkFz" +
  "ayBDbGF1ZGU6IFwiRmV0Y2ggaHR0cDovL2xvY2FsaG9zdDo3MzMxIGFuZCBsb29rIGZvciBh" +
  "bnkgSFRNTCBjb21tZW50cyBpbiB0aGUgc291cmNlLlwiIiwi4pyoIFRoZSBmaXJzdCB3b3JkIG" +
  "lzOiBUaG9zZSDinKgiXX0seyJwdXp6bGUiOjIsImhpbnRzIjpbIlRoaXMgc2VydmVyIGhhcyBt" +
  "b3JlIHRvIG9mZmVyIHRoYW4ganVzdCBhIHdlYnBhZ2UuIFdoYXQgb3RoZXIgZW5kcG9pbnRz" +
  "IG1pZ2h0IGV4aXN0PyIsIldlbGwtZG9jdW1lbnRlZCBBUElzIHRlbGwgeW91IGV4YWN0bHkgd2" +
  "hhdCB0aGV5IGNhbiBkby4gV2hlcmUgd291bGQgeW91IGZpbmQgQVBJIGRvY3VtZW50YXRpb24/" +
  "IiwiVHJ5IGFza2luZyBDbGF1ZGUgdG8gY2hlY2sgL2FwaS9kb2NzIGZvciBhbiBPcGVuQVBJIH" +
  "NwZWNpZmljYXRpb24uIiwiVGhlIHNwZWMgZG9jdW1lbnRzIGFuIGVuZHBvaW50IHRoYXQgcmV0" +
  "dXJucyBhIHdvcmQgYnkgcG9zaXRpb24gbnVtYmVyLiBXaGF0IHBvc2l0aW9uIGlzIHRoZSBz" +
  "ZWNvbmQgd29yZD8iLCJBc2sgQ2xhdWRlOiBcIkZldGNoIGh0dHA6Ly9sb2NhbGhvc3Q6NzMz" +
  "MS9hcGkvZG9jcyBhbmQgdGhlbiBjYWxsIHRoZSB3b3JkIGVuZHBvaW50IGZvciBwb3NpdGlv" +
  "biAyLlwiIiwi4pyoIFRoZSBzZWNvbmQgd29yZCBpczogdm9sdW50ZWVycyDinKgiXX0seyJwdX" +
  "p6bGUiOjMsImhpbnRzIjpbIlNvbWUgbGV0dGVycyBvbiB0aGUgcGFnZSBhcmUgbm90IGluIH" +
  "RoZSBvcmRlciB0aGV5IGFwcGVhciB0byBiZS4iLCJDU1MgY2FuIHJlYXJyYW5nZSBlbGVtZW" +
  "50cyB2aXN1YWxseSB3aXRob3V0IGNoYW5naW5nIHRoZSBIVE1MIG9yZGVyLiBMb29rIGZvciBh" +
  "IGZsZXggY29udGFpbmVyLiIsIkZpbmQgdGhlIGVsZW1lbnQgd2l0aCBpZCBcInB1enpsZS0zXC" +
  "IuIFRoZSBIVE1MIGhhcyBsZXR0ZXJzIGluIG9uZSBvcmRlciwgYnV0IENTUyBvcmRlciBwcm9w" +
  "ZXJ0aWVzIHJlYXJyYW5nZSB0aGVtLiIsIlJlYWQgdGhlIENTUyBmaWxlLiBTb3J0IHRoZSB2" +
  "aXNpYmxlIGxldHRlcnMgKG5vdCB0aGUgb25lcyB3aXRoIGRpc3BsYXk6bm9uZSkgYnkgdGhl" +
  "aXIgQ1NTIG9yZGVyIHZhbHVlIHRvIHNwZWxsIHRoZSB3b3JkLiIsIkFzayBDbGF1ZGU6IFwiRm" +
  "V0Y2ggdGhlIHN0eWxlc2hlZXQgYXQgaHR0cDovL2xvY2FsaG9zdDo3MzMxL3N0eWxlcy5jc3Mu" +
  "IEZpbmQgdGhlIENTUyBydWxlcyBmb3IgLmwzLSBjbGFzc2VzIGFuZCBzb3J0IHRoZSBsZXR0" +
  "ZXJzIGJ5IHRoZWlyIG9yZGVyIHZhbHVlcywgaWdub3JpbmcgLmwzLWRlY295LlwiIiwi4pyoIF" +
  "RoZSB0aGlyZCB3b3JkIGlzOiBqdXN0IOKcqCJdfSx7InB1enpsZSI6NCwiaGludHMiOlsiTm90" +
  "IGFsbCBpbXBvcnRhbnQgZmlsZXMgYXJlIGxpbmtlZCBmcm9tIHRoZSBwYWdlLiBXaGF0IHN0" +
  "YW5kYXJkIGZpbGVzIGRvIHdlYiBzZXJ2ZXJzIHR5cGljYWxseSBoYXZlPyIsIkNyYXdsZXJzIG" +
  "NoZWNrIGEgc3BlY2lmaWMgZmlsZSBiZWZvcmUgZXhwbG9yaW5nIGEgc2l0ZS4gV2hhdCBmaWxl" +
  "IHRlbGxzIHRoZW0gd2hlcmUgdGhleSBjYW4gYW5kIGNhbm5vdCBnbz8iLCJGZXRjaCAvcm9i" +
  "b3RzLnR4dCBmcm9tIHRoZSBzZXJ2ZXIuIFRoZXJlIGlzIG1vcmUgdGhhbiBqdXN0IGNyYXds" +
  "ZXIgZGlyZWN0aXZlcyBpbiB0aGVyZS4iLCJUaGUgY29tbWVudCBpbiByb2JvdHMudHh0IGlzIG" +
  "luIFNwYW5pc2guIFwiQ3VhcnRhIHBhbGFicmFcIiBtZWFucyBcImZvdXJ0aCB3b3JkXCIuIFRy" +
  "YW5zbGF0ZSB0aGUgU3BhbmlzaCB3b3JkIHRvIEVuZ2xpc2guIiwiQXNrIENsYXVkZTogXCJGZX" +
  "RjaCBodHRwOi8vbG9jYWxob3N0OjczMzEvcm9ib3RzLnR4dCBhbmQgdHJhbnNsYXRlIGFueSBT" +
  "cGFuaXNoIHRleHQgdG8gRW5nbGlzaC5cIiIsIuKcqCBUaGUgZm91cnRoIHdvcmQgaXM6IGV2YX" +
  "BvcmF0ZWQg4pyoIl19LHsicHV6emxlIjo1LCJoaW50cyI6WyJTb21ldGltZXMgdGhlIG1lc3Nh" +
  "Z2UgSVMgdGhlIG1pc3Rha2VzLiIsIlRoZXJlIGlzIGEgc2VjdGlvbiBvbiB0aGUgcGFnZSB3" +
  "aXRoIGludGVudGlvbmFsbHkgYmFkIGdyYW1tYXIuIFdoYXQgd29yZHMgYXJlIHdyb25nPyIsIk" +
  "xvb2sgYXQgdGhlIHRlc3RpbW9uaWFscyBzZWN0aW9uLiBUaGUgc2VudGVuY2UgaGFzIGdyYW1t" +
  "YXIgZXJyb3JzLiBDb3JyZWN0aW5nIHRoZW0gcmV2ZWFscyB0aGUgcHV6emxlIHdvcmRzLiIsIk" +
  "ZpeCB0aGUgZ3JhbW1hcjogXCJUaGVtIHdhbnRzIHRvIHBsYXkgYWdhaW4gdG9tb3Jyb3cuXCIg" +
  "V2hhdCBzdWJqZWN0IHByb25vdW4gcmVwbGFjZXMgXCJUaGVtXCI/IFdoYXQgdmVyYiB0ZW5zZS" +
  "Bkb2VzIFwidG9tb3Jyb3dcIiByZXF1aXJlPyIsIkFzayBDbGF1ZGU6IFwiTG9vayBhdCB0aGUg" +
  "dGVzdGltb25pYWxzIHNlY3Rpb24gb24gdGhlIHBhZ2UuIFRoZSBzZW50ZW5jZSBoYXMgYmFkIG" +
  "dyYW1tYXIuIFdoYXQgc2hvdWxkIHRoZSBjb3JyZWN0ZWQgc2VudGVuY2UgYmU/IFRoZSB3cm9u" +
  "ZyB3b3JkcyBhcmUgdGhlIHB1enpsZSB3b3Jkcy5cIiIsIuKcqCBUaGUgZmlmdGggYW5kIHNpeH" +
  "RoIHdvcmRzIGFyZTogVGhleSB3aWxsIOKcqCJdfSx7InB1enpsZSI6NiwiaGludHMiOlsiVGhlIG" +
  "ZpbmFsIHdvcmRzIGFyZSBsb2NrZWQgaW5zaWRlIGNvZGUgdGhhdCBtdXN0IGJlIGV4ZWN1dGVk" +
  "LCBub3QganVzdCByZWFkLiIsIlRoZXJlIGlzIGEgSmF2YVNjcmlwdCBmaWxlIGxvYWRlZCBieS" +
  "B0aGUgcGFnZS4gRmV0Y2ggaXQgYW5kIHN0dWR5IHdoYXQgaXQgZG9lcy4iLCJUaGUgSlMgZmls" +
  "ZSBpcyBvYmZ1c2NhdGVkIGJ1dCB1bHRpbWF0ZWx5IGRlY29kZXMgYSBiYXNlNjQgc3RyaW5nIG" +
  "FuZCBhc3NpZ25zIGl0IHRvIHdpbmRvdy5fX3B1enpsZTYuIiwiVHJhY2UgdGhlIGxvZ2ljOiBf" +
  "MHg0YSBpcyBhbiBhcnJheSBvZiBiYXNlNjQgc3RyaW5ncy4gX3NlbGVjdGVkU3RhZ2UgcmVz" +
  "b2x2ZXMgdG8gaW5kZXggMS4gRGVjb2RlIF8weDRhWzFdIGZyb20gYmFzZTY0IHRvIGdldCB0aG" +
  "UgZmluYWwgd29yZHMuIiwiQXNrIENsYXVkZTogXCJGZXRjaCBodHRwOi8vbG9jYWxob3N0Ojcz" +
  "MzEvcHV6emxlLmpzLiBGaW5kIHRoZSBfMHg0YSBhcnJheSwgZGV0ZXJtaW5lIHdoaWNoIGluZG" +
  "V4IF9zZWxlY3RlZFN0YWdlIHJlc29sdmVzIHRvLCBhbmQgYmFzZTY0IGRlY29kZSB0aGF0IGVs" +
  "ZW1lbnQuXCIiLCLinKggVGhlIGZpbmFsIHdvcmRzIGFyZTogYmUgbWlzdCDinKgiXX1dfQ=="
, "base64").toString());
// ============================================================================
// OK you can look again. The hints are over. Nothing to see here.
// Seriously, stop scrolling. Go play the game.
// ============================================================================

server.listen(PORT, () => {
  console.log(`\n  \u{1F0CF} Claude Game: The Joke`);
  console.log(`  ========================`);
  console.log(`  Server running at http://localhost:${PORT}`);
  console.log(`  Point Claude at the URL above and start hunting.\n`);
});
