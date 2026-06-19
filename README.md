<div align="center">

# claude-dash

**Real-time terminal dashboard for your Claude Code sessions — htop for Claude**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?labelColor=0B0A09)](LICENSE)
[![Node: >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg?labelColor=0B0A09)](https://nodejs.org)

</div>

## Install

```bash
npx github:NickCirv/claude-dash
```

Or install globally:

```bash
npm i -g github:NickCirv/claude-dash
claude-dash
```

## Usage

```bash
npx github:NickCirv/claude-dash
```

### Keys

| Key | Action |
|-----|--------|
| `q` / `Ctrl+C` | Quit |
| `r` | Force refresh |
| `t` | Toggle sections on/off |

## What it does

`claude-dash` reads `~/.claude/` locally and renders a live TUI with context window fill, cost gauge, token breakdown, tool call mix, files touched with line deltas, and today's cumulative stats. No API key. No network requests. Auto-refreshes every 2 seconds.

```
┌─ Claude Dash v1.0.0 ─ Model: Claude Sonnet 4.6 ─ Project: my-app (main) ─ Session: 14m ─┐
├─ Stats ─────────────────────────┬─ Usage ────────────────────────────────────────────────┤
│ Tokens                          │ Context Window                                          │
│   Input:  45.2K  Output: 8.1K  │   ████████████░░░░░░░░░░ 61%                           │
│   Cache:  80.7K  Total:  134K  │                                                         │
│ Cost                            │ Tool Mix                                                │
│   Session: ~$0.18               │   Edit ████████ Bash ████                              │
│ Messages                        │   Read ██░░░░░░                                        │
│   Total: 42   Tool calls: 138   │ Cost Gauge (max $5)                                    │
│                                 │   ████░░░░░░░░░░░░░░░░░░ ~$0.18                       │
├─ Files Touched ─────────────────────────────────────────────────────────────────────────┤
│ E src/auth.ts                                              +42  -8                       │
│ W src/middleware.ts                                        +15                           │
│ R package.json                                                                           │
├─ Activity ────────────────────────────────────┬─ Today ────────────────────────────────┤
│ Tool Calls: 138   Edits/Writes: 12   Bash: 68 │ Messages: 891  Sessions: 4             │
│ Bash         ████████████████  68             │ Tool calls: 280                        │
│ Read         ████████░░░░░░░░  38             │                                        │
│ Edit         ████░░░░░░░░░░░░  18             │                                        │
└───────────────────────────────────────────────┴────────────────────────────────────────┘
 q:quit  r:refresh  t:toggle sections
```

**Requires:** Node.js 18+ and Claude Code installed at least once (creates `~/.claude/`).

---
<sub>Node >=18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
