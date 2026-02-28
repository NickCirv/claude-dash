# claude-dash

Real-time terminal dashboard for Claude Code sessions — htop for Claude.

<p align="center">
  <img src="https://img.shields.io/npm/v/claude-dash.svg" alt="npm version" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="node >= 18" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license" />
</p>

## Why

Claude Code sessions generate a lot of data — tokens consumed, files edited, tools called, costs accumulating — and none of it is visible while you work. `claude-dash` reads directly from `~/.claude/` and renders it as a live TUI: context window usage, cost gauge, tool call breakdown, files touched with line deltas, and today's cumulative stats. No API key needed. All local.

## Quick Start

```bash
npx claude-dash
```

Or install globally and run from any terminal pane:

```bash
npm i -g claude-dash
claude-dash
```

## What It Does

- Reads `~/.claude/projects/*/[session-id].jsonl` — parses latest session events
- Reads `~/.claude/session-metrics.json` — current model and context window percentage
- Reads `~/.claude/stats-cache.json` — historical daily activity counts
- Renders a full-terminal TUI using `blessed` — auto-refreshes every 2 seconds
- Shows context window fill bar with color coding (green → yellow → red)
- Cost gauge capped at $5 with a visual progress bar
- Tool mix breakdown: Edit vs Bash vs Read proportions
- Files touched list sorted by operation type (writes/edits first, reads last) with `+`/`-` line deltas
- Activity panel with per-tool call counts and bar chart for top 6 tools
- Today's totals panel: message count, session count, tool calls
- Session header: model name, project name, git branch, session duration, session ID

## Dashboard Layout

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
│ Tool Calls: 138   Edits/Writes: 12   Bash: 68 │ 2026-02-28                             │
│                                               │   Messages:   891                      │
│ Bash         ████████████████  68             │   Sessions:   4                        │
│ Read         ████████░░░░░░░░  38             │   Tool calls: 280                      │
│ Edit         ████░░░░░░░░░░░░  18             │                                        │
└───────────────────────────────────────────────┴────────────────────────────────────────┘
 q:quit  r:refresh  t:toggle sections
```

## Keys

| Key | Action |
|-----|--------|
| `q` or `Q` or `Ctrl+C` | Quit |
| `r` or `R` | Force refresh now |
| `t` or `T` | Toggle all sections on/off |

## What It Reads

| File | Purpose |
|------|---------|
| `~/.claude/projects/*/[session-id].jsonl` | Session events — tokens, tool calls, file operations |
| `~/.claude/session-metrics.json` | Current model and context window percentage |
| `~/.claude/stats-cache.json` | Historical daily message/session/tool counts |

All parsing is local — no network requests, no API key required.

## Requirements

- Node.js 18+
- Claude Code CLI installed and used at least once (creates `~/.claude/`)

## Install Globally

```bash
npm i -g claude-dash
```

## License

MIT
