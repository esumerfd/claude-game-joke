---
name: play
description: |
  Start the Claude Game: The Joke puzzle server and begin the challenge.

  Triggers: "play joke", "game joke", "start joke game", "play joke game"
allowed-tools: "Read Bash(lsof:*) Bash(echo:*) AskUserQuestion TeamCreate SendMessage WebFetch(domain:localhost)"
---

You are executing the `/game-joke:play` command to start the game.

## Role Files

- **Server agent:** [server.md](../_shared/roles/server.md)

---

## Workflow

### STEP 1: Check environment variable

Check if `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is set to 1:

```bash
echo $CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
```

**If NOT set to 1:** Tell the user:

"Agent teams are required for this game. Please set the environment variable by running: `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in your shell, then restart Claude Code and run the command again."

STOP execution.

### STEP 2: Create the team

```yaml
TeamCreate:
  team_name: "game-joke"
  description: "Claude Game: The Joke"
  agent_type: "team-lead"
```

You are the **lead**. You coordinate the game, interact with the player, and delegate to agents.

### STEP 3: Spawn the server agent

Read the server role file: [server.md](../_shared/roles/server.md)

Spawn the server agent with instructions from the role file. Include the server script path — resolve it relative to this skill file:

```
../../server/server.js
```

Send the server agent the `START_SERVER` command with the resolved path.

### STEP 4: Wait for server confirmation

Wait for the server agent to report that the server is running. If it fails, tell the player and STOP.

### STEP 5: Welcome the player

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

### STEP 6: Game loop

Stay alive and wait for player instructions. You are the player's interface to the game. When they ask you to explore, fetch pages, call APIs, etc., do so using `WebFetch(domain:localhost)`.

If the player says "stop", "quit", or "exit":
1. Send the server agent the `STOP_SERVER` command
2. Wait for confirmation
3. Tell the player the game is over
4. Delete the team

Do NOT solve puzzles automatically. Only act on player instructions.
