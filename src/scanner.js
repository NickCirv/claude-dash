/**
 * Reads ~/.claude/ for live session data.
 * Parses JSONL session files, session-metrics.json, stats-cache.json.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { calculateCost, getModelLabel } from './cost.js';

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const METRICS_FILE = path.join(CLAUDE_DIR, 'session-metrics.json');
const STATS_FILE = path.join(CLAUDE_DIR, 'stats-cache.json');

/**
 * Safe JSON parse, returns null on failure.
 */
function safeJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Safe file read, returns null on failure.
 */
function readFile(filepath) {
  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Read session-metrics.json — written by Claude Code during active sessions.
 */
function readSessionMetrics() {
  const raw = readFile(METRICS_FILE);
  if (!raw) return null;
  return safeJSON(raw);
}

/**
 * Read stats-cache.json — historical daily activity.
 */
function readStatsCache() {
  const raw = readFile(STATS_FILE);
  if (!raw) return null;
  return safeJSON(raw);
}

/**
 * Get all project directories under ~/.claude/projects/
 */
function getProjectDirs() {
  const projectsDir = path.join(CLAUDE_DIR, 'projects');
  try {
    return fs.readdirSync(projectsDir)
      .filter(name => {
        const full = path.join(projectsDir, name);
        return fs.statSync(full).isDirectory();
      })
      .map(name => path.join(projectsDir, name));
  } catch {
    return [];
  }
}

/**
 * Find the most recently modified JSONL file across all project dirs.
 * This is the active session.
 */
function findActiveSessionFile() {
  let newest = null;
  let newestMtime = 0;

  for (const dir of getProjectDirs()) {
    let files;
    try {
      files = fs.readdirSync(dir);
    } catch {
      continue;
    }

    for (const file of files) {
      if (!file.endsWith('.jsonl')) continue;
      const full = path.join(dir, file);
      try {
        const stat = fs.statSync(full);
        if (stat.mtimeMs > newestMtime) {
          newestMtime = stat.mtimeMs;
          newest = { path: full, mtime: stat.mtimeMs, dir };
        }
      } catch {
        // skip
      }
    }
  }

  return newest;
}

/**
 * Parse a JSONL session file and extract metrics.
 */
function parseSessionFile(filePath) {
  const raw = readFile(filePath);
  if (!raw) return null;

  const lines = raw.split('\n').filter(l => l.trim());

  let model = null;
  let sessionId = null;
  let cwd = null;
  let gitBranch = null;
  let firstTimestamp = null;
  let lastTimestamp = null;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheCreation = 0;
  let totalCacheRead = 0;
  let totalCost = 0;
  let toolCalls = [];
  const filesTouched = new Map(); // path -> { added, removed }
  let messageCount = 0;

  for (const line of lines) {
    const entry = safeJSON(line);
    if (!entry) continue;

    // Capture session metadata from first entry
    if (!sessionId && entry.sessionId) sessionId = entry.sessionId;
    if (!cwd && entry.cwd) cwd = entry.cwd;
    if (!gitBranch && entry.gitBranch) gitBranch = entry.gitBranch;

    const ts = entry.timestamp ? new Date(entry.timestamp).getTime() : null;
    if (ts) {
      if (!firstTimestamp || ts < firstTimestamp) firstTimestamp = ts;
      if (!lastTimestamp || ts > lastTimestamp) lastTimestamp = ts;
    }

    if (entry.type === 'assistant' && entry.message) {
      const msg = entry.message;

      // Track model
      if (msg.model) model = msg.model;

      // Track tokens & cost
      if (msg.usage) {
        const u = msg.usage;
        totalInputTokens += (u.input_tokens || 0);
        totalOutputTokens += (u.output_tokens || 0);
        totalCacheCreation += (u.cache_creation_input_tokens || 0);
        totalCacheRead += (u.cache_read_input_tokens || 0);
        totalCost += calculateCost(u, msg.model);
      }

      // Track tool calls and files touched
      for (const block of (msg.content || [])) {
        if (block.type === 'tool_use') {
          toolCalls.push(block.name);

          const inp = block.input || {};
          const toolName = block.name;

          if (toolName === 'Write' && inp.file_path) {
            const fp = inp.file_path;
            const content = inp.content || '';
            const lines = content.split('\n').length;
            const existing = filesTouched.get(fp) || { added: 0, removed: 0, op: 'created' };
            filesTouched.set(fp, { ...existing, added: existing.added + lines, op: 'write' });
          } else if (toolName === 'Edit' && inp.file_path) {
            const fp = inp.file_path;
            const newStr = (inp.new_string || '').split('\n').length;
            const oldStr = (inp.old_string || '').split('\n').length;
            const existing = filesTouched.get(fp) || { added: 0, removed: 0, op: 'edit' };
            filesTouched.set(fp, {
              ...existing,
              added: existing.added + newStr,
              removed: existing.removed + oldStr,
              op: 'edit',
            });
          } else if (toolName === 'Read' && inp.file_path) {
            const fp = inp.file_path;
            if (!filesTouched.has(fp)) {
              filesTouched.set(fp, { added: 0, removed: 0, op: 'read' });
            }
          }
        }
      }

      messageCount++;
    }
  }

  const editCount = toolCalls.filter(t => t === 'Edit' || t === 'Write').length;
  const bashCount = toolCalls.filter(t => t === 'Bash').length;
  const readCount = toolCalls.filter(t => t === 'Read').length;

  return {
    sessionId,
    model,
    cwd,
    gitBranch,
    firstTimestamp,
    lastTimestamp,
    totalInputTokens,
    totalOutputTokens,
    totalCacheCreation,
    totalCacheRead,
    totalCost,
    toolCallCount: toolCalls.length,
    editCount,
    bashCount,
    readCount,
    filesTouched: Array.from(filesTouched.entries()).map(([fp, stats]) => ({
      path: fp,
      name: path.basename(fp),
      dir: path.dirname(fp),
      ...stats,
    })),
    messageCount,
    toolBreakdown: countBy(toolCalls),
  };
}

function countBy(arr) {
  return arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Get today's activity from stats-cache.
 */
function getTodayStats(statsCache) {
  if (!statsCache || !statsCache.dailyActivity) return null;
  const today = new Date().toISOString().split('T')[0];
  return statsCache.dailyActivity.find(d => d.date === today) || null;
}

/**
 * Get active agents from ~/.claude/todos/ directory.
 */
function getActiveTodos() {
  const todosDir = path.join(CLAUDE_DIR, 'todos');
  try {
    const files = fs.readdirSync(todosDir);
    let todos = [];
    for (const file of files.slice(-5)) { // only recent
      const raw = readFile(path.join(todosDir, file));
      if (!raw) continue;
      const parsed = safeJSON(raw);
      if (Array.isArray(parsed)) {
        todos = todos.concat(parsed);
      }
    }
    return todos;
  } catch {
    return [];
  }
}

/**
 * Main scan — returns full dashboard state.
 */
export function scan() {
  const metrics = readSessionMetrics();
  const statsCache = readStatsCache();
  const activeFile = findActiveSessionFile();

  let session = null;
  if (activeFile) {
    session = parseSessionFile(activeFile.path);
  }

  const todayStats = getTodayStats(statsCache);
  const todos = getActiveTodos();

  // Session duration
  let durationMs = 0;
  let durationLabel = '—';
  if (session && session.firstTimestamp) {
    durationMs = (session.lastTimestamp || Date.now()) - session.firstTimestamp;
    durationLabel = formatDuration(durationMs);
  }

  // Model label
  const modelLabel = session?.model
    ? getModelLabel(session.model)
    : metrics?.model || 'Unknown';

  // Context window from metrics
  const contextWindow = metrics?.contextWindow || null;

  // Working directory — prefer session cwd, fallback to metrics
  const workingDir = session?.cwd || metrics?.workingDir || null;
  const projectName = workingDir ? path.basename(workingDir) : 'Unknown';

  // Total tokens
  const totalTokens = session
    ? session.totalInputTokens + session.totalOutputTokens + session.totalCacheCreation
    : 0;

  return {
    model: modelLabel,
    rawModel: session?.model || null,
    projectName,
    workingDir,
    gitBranch: session?.gitBranch || null,
    sessionId: session?.sessionId || metrics?.sessionId || null,
    duration: durationLabel,
    durationMs,
    totalTokens,
    inputTokens: session?.totalInputTokens || 0,
    outputTokens: session?.totalOutputTokens || 0,
    cacheTokens: (session?.totalCacheCreation || 0) + (session?.totalCacheRead || 0),
    estimatedCost: session?.totalCost || 0,
    contextWindow,
    toolCallCount: session?.toolCallCount || 0,
    editCount: session?.editCount || 0,
    bashCount: session?.bashCount || 0,
    readCount: session?.readCount || 0,
    filesTouched: session?.filesTouched || [],
    messageCount: session?.messageCount || 0,
    toolBreakdown: session?.toolBreakdown || {},
    todayStats,
    todos,
    activeSessionFile: activeFile?.path || null,
    lastRefresh: new Date(),
  };
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}
