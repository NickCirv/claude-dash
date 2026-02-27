# claude-dash

Real-time terminal dashboard for Claude Code sessions. Think `htop` but for Claude.

```
┌─ Claude Dash v1.0.0 ─ Model: Claude Sonnet 4.6 ─ Project: my-app ─ Session: 14m ─┐
├─ Stats ─────────────────────────┬─ Usage ────────────────────────────────────────┤
│ Tokens                          │ Context Window                                  │
│   Input:  45.2K  Output: 8.1K  │   ████████████░░░░░░░░░░ 61%                   │
│   Cache:  80.7K  Total:  134K  │                                                 │
│ Cost                            │ Tool Mix                                        │
│   Session: ~$0.18               │   Edit ████████ Bash ████                      │
│ Messages                        │ Cost Gauge (max $5)                             │
│   Total: 42   Tool calls: 138   │   ████░░░░░░░░░░░░░░░░░░ ~$0.18               │
├─ Files Touched ─────────────────────────────────────────────────────────────────┤
│ E src/auth.ts                                         +42  -8                   │
│ W src/middleware.ts                                   +15                       │
│ R package.json                                                                  │
├─ Activity ────────────────────────────────┬─ Today ────────────────────────────┤
│ Tool Calls: 138   Edits/Writes: 12        │ 2026-02-27                         │
│                                           │   Messages:   891                  │
│ Bash         ████████████████  68         │   Sessions:   4                    │
│ Read         ████████░░░░░░░░  38         │   Tool calls: 280                  │
│ Edit         ████░░░░░░░░░░░░  18         │                                    │
└───────────────────────────────────────────┴────────────────────────────────────┘
 q:quit  r:refresh  t:toggle sections
```

## Install

```bash
npm install -g claude-dash
# or
npx claude-dash
```

## Usage

```bash
claude-dash
```

Reads from `~/.claude/` — no API key needed. All local file parsing.

## Keys

| Key | Action |
|-----|--------|
| `q` | Quit |
| `r` | Force refresh |
| `t` | Toggle sections on/off |

## What it reads

- `~/.claude/session-metrics.json` — current session model + context window %
- `~/.claude/projects/*/[session-id].jsonl` — latest session events (tokens, tools, files)
- `~/.claude/stats-cache.json` — historical daily activity counts

## Requirements

- Node.js 18+
- Claude Code CLI (`claude`) installed and used at least once
