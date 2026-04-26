---
name: play
description: |
  Start the Claude Game: The Joke puzzle server and begin the challenge.

  Triggers: "play joke", "game joke", "start joke game", "play joke game"
allowed-tools: "WebFetch(domain:localhost)"
---

You are executing the `/game-joke:play` command to start the game.

## Workflow

### STEP 1: Tell the user to start the server

The server script is at this path relative to this skill file:

```
../../server/server.js
```

Resolve that path against the skill's base directory and tell the user:

"To start the game server, run this command in your terminal:

```
node <resolved-path-to-server.js>
```

Then open http://localhost:7331 in your browser and let me know when it's running."

### STEP 2: Verify the server is reachable

Once the user says the server is running, fetch `http://localhost:7331` using `WebFetch`.

- If the fetch succeeds: proceed to Step 3.
- If the fetch fails: tell the user the server doesn't appear reachable and ask them to check it's running on port 7331.

### STEP 3: Welcome the player

Display this message:

```
🃏 Claude Game: The Joke

A joke has been split into pieces and hidden across this server.
Your mission: find every word and reassemble the punchline.

  Server: http://localhost:7331

Rules:
  - There are 6 puzzles, each hiding one or more words
  - Use only Claude to explore — no dev tools, no peeking
  - Not everything is a clue — beware of distractions
  - When you have the full joke, you'll know — it has a punchline

Ready? Tell me to start exploring!
```

### STEP 4: Game loop

Stay alive and wait for player instructions. You are the player's interface to the game. When they ask you to explore, fetch pages, call APIs, etc., do so using `WebFetch(domain:localhost)`.

If the player says "stop", "quit", or "exit":
1. Tell the player to stop the server by pressing `Ctrl+C` in their terminal.
2. Tell the player the game is over.

Do NOT solve puzzles automatically. Only act on player instructions.
