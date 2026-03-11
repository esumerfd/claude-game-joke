# Claude Game: The Joke

```
    ┌─────────────────────────────────────────────┐
    │                                             │
    │   🔍  Can your AI find what's hidden?  🔍   │
    │                                             │
    │         ╔═══════════════════════╗           │
    │         ║                       ║           │
    │         ║   T _ _ _ _           ║           │
    │         ║   _ _ _ _ _ _ _ _ _   ║           │
    │         ║   _ _ _ _             ║           │
    │         ║   _ _ _ _ _ _ _ _ _ _ ║           │
    │         ║   . _ _ _ _           ║           │
    │         ║   _ _ _ _             ║           │
    │         ║   _ _   _ _ _ _ .     ║           │
    │         ║                       ║           │
    │         ╚═══════════════════════╝           │
    │                                             │
    │      A puzzle game for Claude users.        │
    │      The words are here. Somewhere.         │
    │                                             │
    └─────────────────────────────────────────────┘
```

## What Is This?

Somewhere inside this server lives a joke — split into pieces and scattered across the page, its APIs, its files, and its code. Your job is to find every word and put the joke back together.

The catch? **You can only use Claude to find them.**

No peeking at source code yourself. No browser dev tools. No curl from your terminal. Just you, Claude, and your wits.

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed
- [Node.js](https://nodejs.org/) (for the game server)
- Agent teams enabled:
  ```bash
  export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
  ```

## How To Play

### 1. Add the marketplace

Register the game's plugin marketplace with Claude Code:

```bash
claude plugin marketplace add git@github.com:esumerfd/claude-game-joke.git
```

### 2. Install the plugin

```bash
claude plugin install game-joke
```

### 3. Restart Claude Code

Close and reopen Claude Code so it picks up the new skill:

```bash
claude
```

### 4. Start the game

From any directory, run the slash command:

```
/game-joke:play
```

This starts the puzzle server on `http://localhost:7331` and presents the challenge.

### 5. Open the page in your browser

Visit [http://localhost:7331](http://localhost:7331) in your browser to see the puzzle page. Read the challenge, look around, get a feel for it — but remember, you're not allowed to use dev tools or view source yourself. That's Claude's job.

### 6. Start exploring

Give Claude instructions to investigate the server. Here's a starter prompt to prove the connection works:

```
Fetch http://localhost:7331 and show me the page title and any text content you find.
```

From there, direct Claude to dig deeper. There are **6 puzzles** hidden across the server, each containing one or more words of the joke. They get progressively harder.

| Puzzle | Difficulty | Hint |
|--------|-----------|------|
| 1 | Easy | Look beneath the surface |
| 2 | Easy-Medium | Every good API tells you what it can do |
| 3 | Medium | What you see isn't always what you get |
| 4 | Medium | Not everything speaks English |
| 5 | Medium | Sometimes the mistakes ARE the message |
| 6 | Hard | Some things only make sense when you run them |

### 7. Assemble the joke

Once you've found all the words, put them together. You'll know when you've got it — it's a proper joke with a punchline.

## Rules

- **Claude only.** You must use Claude to explore the server, discover endpoints, read source, and solve puzzles.
- **No manual inspection.** Don't open dev tools, view source in your browser, or poke around yourself.
- **Hints are fair game.** The puzzle table above is all you get. Everything else, Claude has to find.

## Fair Warning

Not everything on the server is a clue. Some things are... distractions. If Claude starts waxing poetic or chasing shadows, it might be on the wrong track.

## Stopping the Game

Tell Claude to stop, quit, or exit, and it will shut down the server and end the session.

## Cleanup

When you're done with the game, uninstall the plugin and remove the marketplace:

```bash
claude plugin uninstall game-joke
claude plugin marketplace remove claude-game-joke
```

Good luck. The joke is waiting.

---

*A game by [@esumerfd](https://github.com/esumerfd)*
