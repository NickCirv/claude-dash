/**
 * Main dashboard render loop.
 * Manages the blessed screen, refresh cycle, and keyboard bindings.
 */

import blessed from 'blessed';
import { scan } from './scanner.js';
import { formatCost, formatTokens } from './cost.js';
import {
  createScreen,
  createHeader,
  createStatsPanel,
  createCostMeter,
  createFileList,
  createActivityBar,
  createTodayPanel,
  createStatusBar,
  buildBar,
  barColor,
  truncatePath,
} from './widgets.js';

const REFRESH_MS = 2000;
const VERSION = '1.0.0';

// Toggle state for sections
const toggleState = {
  files: true,
  activity: true,
  today: true,
};

/**
 * Format model name for header display.
 */
function shortModel(label) {
  if (!label || label === 'Unknown') return '{gray-fg}Unknown{/}';
  if (label.includes('Opus')) return `{magenta-fg}${label}{/}`;
  if (label.includes('Sonnet')) return `{cyan-fg}${label}{/}`;
  if (label.includes('Haiku')) return `{green-fg}${label}{/}`;
  return `{white-fg}${label}{/}`;
}

/**
 * Render header content.
 */
function renderHeader(box, data) {
  const model = shortModel(data.model);
  const proj = data.projectName
    ? `{white-fg}${data.projectName}{/}`
    : '{gray-fg}No project{/}';
  const branch = data.gitBranch
    ? ` {gray-fg}({/}{yellow-fg}${data.gitBranch}{/}{gray-fg}){/}`
    : '';
  const dur = `{white-fg}${data.duration}{/}`;
  const sessionShort = data.sessionId
    ? `{gray-fg}${data.sessionId.slice(0, 8)}…{/}`
    : '{gray-fg}—{/}';

  box.setContent(
    ` {bold}{cyan-fg}Claude Dash{/} {gray-fg}v${VERSION}{/}  ` +
    `Model: ${model}  ` +
    `Project: ${proj}${branch}  ` +
    `Session: ${dur}  ` +
    `ID: ${sessionShort}`
  );
}

/**
 * Render stats panel (tokens + counts).
 */
function renderStats(box, data) {
  const inputTok = formatTokens(data.inputTokens);
  const outputTok = formatTokens(data.outputTokens);
  const cacheTok = formatTokens(data.cacheTokens);
  const totalTok = formatTokens(data.totalTokens);
  const cost = formatCost(data.estimatedCost);

  const lines = [
    ` {white-fg}Tokens{/}`,
    `   Input:  {cyan-fg}${inputTok}{/}   Output: {green-fg}${outputTok}{/}`,
    `   Cache:  {yellow-fg}${cacheTok}{/}   Total:  {white-fg}${totalTok}{/}`,
    ` {white-fg}Cost{/}`,
    `   Session: {yellow-fg}${cost}{/}`,
    ` {white-fg}Messages{/}`,
    `   Total: {white-fg}${data.messageCount}{/}   Tool calls: {cyan-fg}${data.toolCallCount}{/}`,
  ];

  box.setContent(lines.join('\n'));
}

/**
 * Render cost meter (visual usage bars).
 */
function renderCostMeter(box, data) {
  const lines = [];

  // Context window usage
  if (data.contextWindow) {
    const usedPct = data.contextWindow.usedPercent || 0;
    const color = barColor(usedPct);
    const bar = buildBar(usedPct, 24);
    lines.push(` {white-fg}Context Window{/}`);
    lines.push(`   {${color}-fg}${bar}{/} {white-fg}${usedPct}%{/}`);
  } else {
    lines.push(` {white-fg}Context Window{/}`);
    lines.push(`   {gray-fg}No live data{/}`);
  }

  // Tool call breakdown bar
  const total = data.toolCallCount || 1;
  const editPct = Math.round(((data.editCount || 0) / total) * 100);
  const bashPct = Math.round(((data.bashCount || 0) / total) * 100);
  const readPct = Math.round(((data.readCount || 0) / total) * 100);

  lines.push('');
  lines.push(` {white-fg}Tool Mix{/}`);
  lines.push(`   {green-fg}Edit ${buildBar(editPct, 8)}{/} {cyan-fg}Bash ${buildBar(bashPct, 8)}{/}`);
  lines.push(`   {yellow-fg}Read ${buildBar(readPct, 8)}{/}`);

  // Cost gauge (cap at $5 for display)
  const costPct = Math.min(100, (data.estimatedCost / 5) * 100);
  const costColor = barColor(costPct);
  const costBar = buildBar(costPct, 20);
  lines.push('');
  lines.push(` {white-fg}Cost Gauge{/} {gray-fg}(max $5){/}`);
  lines.push(`   {${costColor}-fg}${costBar}{/} {white-fg}${formatCost(data.estimatedCost)}{/}`);

  box.setContent(lines.join('\n'));
}

/**
 * Render files touched list.
 */
function renderFileList(box, data) {
  if (!toggleState.files) {
    box.setContent('{gray-fg} (hidden — press t to show){/}');
    return;
  }

  const files = data.filesTouched;
  if (!files || files.length === 0) {
    box.setContent('{gray-fg} No files touched this session{/}');
    return;
  }

  // Sort: edited/written first, then read
  const sorted = [...files].sort((a, b) => {
    const rank = { write: 0, edit: 0, created: 0, read: 1 };
    return (rank[a.op] ?? 1) - (rank[b.op] ?? 1);
  });

  const lines = sorted.slice(0, 12).map(f => {
    const name = truncatePath(f.path, 50).padEnd(52);
    const added = f.added > 0 ? `{green-fg}+${f.added}{/}` : '';
    const removed = f.removed > 0 ? `{red-fg}-${f.removed}{/}` : '';
    const opColor = f.op === 'read' ? 'gray' : f.op === 'write' || f.op === 'created' ? 'green' : 'yellow';
    const opLabel = f.op === 'read' ? 'R' : f.op === 'write' || f.op === 'created' ? 'W' : 'E';
    const delta = [added, removed].filter(Boolean).join('  ');
    return ` {${opColor}-fg}${opLabel}{/} {white-fg}${name}{/}  ${delta}`;
  });

  if (files.length > 12) {
    lines.push(`{gray-fg} … and ${files.length - 12} more{/}`);
  }

  box.setContent(lines.join('\n'));
}

/**
 * Render activity bar with tool call visualization.
 */
function renderActivity(box, data) {
  if (!toggleState.activity) {
    box.setContent('{gray-fg} (hidden — press t to show){/}');
    return;
  }

  const breakdown = data.toolBreakdown || {};
  const total = data.toolCallCount || 0;

  const lines = [
    ` {white-fg}Tool Calls:{/} {cyan-fg}${total}{/}   {white-fg}Edits/Writes:{/} {green-fg}${data.editCount}{/}   {white-fg}Bash:{/} {yellow-fg}${data.bashCount}{/}   {white-fg}Reads:{/} {gray-fg}${data.readCount}{/}`,
    '',
  ];

  // Top tools bar
  const topTools = Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (topTools.length > 0) {
    const barWidth = 16;
    const maxVal = topTools[0][1];
    for (const [name, count] of topTools) {
      const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;
      const bar = buildBar(pct, barWidth);
      const color = name === 'Bash' ? 'yellow' : name.includes('Write') || name === 'Edit' ? 'green' : name === 'Read' ? 'gray' : 'cyan';
      lines.push(` {${color}-fg}${name.padEnd(12)}{/} {${color}-fg}${bar}{/} {white-fg}${count}{/}`);
    }
  } else {
    lines.push('{gray-fg} No tool calls yet{/}');
  }

  box.setContent(lines.join('\n'));
}

/**
 * Render today's totals.
 */
function renderToday(box, data) {
  if (!toggleState.today) {
    box.setContent('{gray-fg} (hidden — press t to show){/}');
    return;
  }

  const today = data.todayStats;
  if (!today) {
    box.setContent('{gray-fg} No data for today yet{/}');
    return;
  }

  const lines = [
    ` {white-fg}${today.date}{/}`,
    `   Messages:  {cyan-fg}${today.messageCount || 0}{/}`,
    `   Sessions:  {white-fg}${today.sessionCount || 0}{/}`,
    `   Tool calls:{yellow-fg}${today.toolCallCount || 0}{/}`,
  ];

  box.setContent(lines.join('\n'));
}

/**
 * Render status bar.
 */
function renderStatus(box, lastRefresh) {
  const time = lastRefresh.toLocaleTimeString();
  box.setContent(
    ` q:quit  r:refresh  t:toggle sections  {|}Last update: ${time} `
  );
}

/**
 * Main entrypoint — create screen, render loop, keyboard bindings.
 */
export function start() {
  const screen = createScreen();
  const header = createHeader(screen);
  const stats = createStatsPanel(screen);
  const meter = createCostMeter(screen);
  const fileList = createFileList(screen);
  const activity = createActivityBar(screen);
  const today = createTodayPanel(screen);
  const status = createStatusBar(screen);

  let data = null;
  let refreshTimer = null;

  function render() {
    try {
      data = scan();

      renderHeader(header, data);
      renderStats(stats, data);
      renderCostMeter(meter, data);
      renderFileList(fileList, data);
      renderActivity(activity, data);
      renderToday(today, data);
      renderStatus(status, data.lastRefresh);

      screen.render();
    } catch (err) {
      // Silent fail — next tick will retry
    }
  }

  function scheduleRefresh() {
    refreshTimer = setTimeout(() => {
      render();
      scheduleRefresh();
    }, REFRESH_MS);
  }

  // Keyboard bindings
  screen.key(['q', 'Q', 'C-c'], () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    screen.destroy();
    process.exit(0);
  });

  screen.key(['r', 'R'], () => {
    render();
  });

  screen.key(['t', 'T'], () => {
    // Cycle through section toggles
    const keys = ['files', 'activity', 'today'];
    const allOn = keys.every(k => toggleState[k]);
    if (allOn) {
      keys.forEach(k => { toggleState[k] = false; });
    } else {
      keys.forEach(k => { toggleState[k] = true; });
    }
    render();
  });

  // Initial render
  render();
  scheduleRefresh();
}
