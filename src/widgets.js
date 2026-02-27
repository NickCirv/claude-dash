/**
 * Terminal UI widget builders using blessed.
 * Each widget is a blessed box/element configured for the dashboard layout.
 */

import blessed from 'blessed';

/**
 * Create the main screen.
 */
export function createScreen() {
  return blessed.screen({
    smartCSR: true,
    title: 'Claude Dash',
    fullUnicode: true,
    warnings: false,
  });
}

/**
 * Header bar — model, project, session duration.
 */
export function createHeader(screen) {
  return blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      bg: 'black',
    },
    tags: true,
    content: '',
  });
}

/**
 * Stats panel — tokens, cost, context window, tool calls.
 */
export function createStatsPanel(screen) {
  return blessed.box({
    parent: screen,
    top: 3,
    left: 0,
    width: '50%',
    height: 9,
    border: { type: 'line' },
    label: ' {cyan-fg}Stats{/} ',
    style: {
      border: { fg: 'cyan' },
      bg: 'black',
    },
    tags: true,
    content: '',
  });
}

/**
 * Cost meter — visual bar for cost/context usage.
 */
export function createCostMeter(screen) {
  return blessed.box({
    parent: screen,
    top: 3,
    left: '50%',
    width: '50%',
    height: 9,
    border: { type: 'line' },
    label: ' {cyan-fg}Usage{/} ',
    style: {
      border: { fg: 'cyan' },
      bg: 'black',
    },
    tags: true,
    content: '',
  });
}

/**
 * Files touched list.
 */
export function createFileList(screen) {
  return blessed.box({
    parent: screen,
    top: 12,
    left: 0,
    width: '100%',
    height: 10,
    border: { type: 'line' },
    label: ' {cyan-fg}Files Touched{/} ',
    style: {
      border: { fg: 'cyan' },
      bg: 'black',
    },
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    content: '',
  });
}

/**
 * Activity bar — tool call breakdown.
 */
export function createActivityBar(screen) {
  return blessed.box({
    parent: screen,
    top: 22,
    left: 0,
    width: '60%',
    height: 7,
    border: { type: 'line' },
    label: ' {cyan-fg}Activity{/} ',
    style: {
      border: { fg: 'cyan' },
      bg: 'black',
    },
    tags: true,
    content: '',
  });
}

/**
 * Today's totals panel.
 */
export function createTodayPanel(screen) {
  return blessed.box({
    parent: screen,
    top: 22,
    left: '60%',
    width: '40%',
    height: 7,
    border: { type: 'line' },
    label: ' {cyan-fg}Today{/} ',
    style: {
      border: { fg: 'cyan' },
      bg: 'black',
    },
    tags: true,
    content: '',
  });
}

/**
 * Status bar at the bottom.
 */
export function createStatusBar(screen) {
  return blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    style: {
      fg: 'black',
      bg: 'cyan',
    },
    tags: true,
    content: '',
  });
}

/**
 * Build a progress bar string using block chars.
 * pct: 0–100, width: bar character width
 */
export function buildBar(pct, width = 20, filledChar = '\u2588', emptyChar = '\u2591') {
  const clamped = Math.max(0, Math.min(100, pct));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;
  return filledChar.repeat(filled) + emptyChar.repeat(empty);
}

/**
 * Colour a bar based on percentage (green → yellow → red).
 */
export function barColor(pct) {
  if (pct < 50) return 'green';
  if (pct < 80) return 'yellow';
  return 'red';
}

/**
 * Truncate a path for display, keeping the filename.
 */
export function truncatePath(p, maxLen = 45) {
  if (!p || p.length <= maxLen) return p || '';
  const parts = p.split('/');
  const file = parts[parts.length - 1];
  const dir = parts.slice(0, -1).join('/');
  const abbreviated = '…' + dir.slice(-(maxLen - file.length - 2)) + '/' + file;
  return abbreviated.length <= maxLen ? abbreviated : '…' + file.slice(-(maxLen - 1));
}
