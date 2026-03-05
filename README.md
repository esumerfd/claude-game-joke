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

## How To Play

### 1. Install the Plugin

```bash
claude plugin marketplace add git@github.com:esumerfd/claude-game-joke.git
claude plugin install game-joke
```

### 2. Restart Claude

After installing the plugin, **restart Claude Code** so it picks up the new skill.

### 3. Start the Game

```
/game-joke:play
```

This launches the game server on `http://localhost:7331` and gives Claude the challenge prompt.

### 4. Find The Joke

The joke is split into **6 puzzles**, each hiding one or more words. They escalate in difficulty:

| Puzzle | Difficulty | Hint |
|--------|-----------|------|
| 1 | Easy | Look beneath the surface |
| 2 | Easy-Medium | Every good API tells you what it can do |
| 3 | Medium | What you see isn't always what you get |
| 4 | Medium | Not everything speaks English |
| 5 | Medium | Sometimes the mistakes ARE the message |
| 6 | Hard | Some things only make sense when you run them |

### 5. Assemble & Verify

Once you think you've found all the words, put the joke together. You'll know when you've got it — it's a proper joke with a punchline.

## Rules

- **Claude only.** You must use Claude to explore the server, discover endpoints, read source, and solve puzzles.
- **No manual inspection.** Don't open dev tools, view source in your browser, or poke around yourself.
- **Hints are fair game.** The puzzle table above is all you get. Everything else, Claude has to find.

## Fair Warning

Not everything on the server is a clue. Some things are... distractions. If Claude starts waxing poetic or chasing shadows, it might be on the wrong track.

Good luck. The joke is waiting.

---

*A game by [@esumerfd](https://github.com/esumerfd)*
