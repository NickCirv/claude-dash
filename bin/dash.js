#!/usr/bin/env node
/**
 * claude-dash — Real-time terminal dashboard for Claude Code sessions.
 * Usage: npx claude-dash
 */

import { start } from '../src/index.js';

// Check node version
const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  process.stderr.write('claude-dash requires Node.js 18+\n');
  process.exit(1);
}

// Ensure we have a TTY
if (!process.stdout.isTTY) {
  process.stderr.write('claude-dash must be run in a terminal\n');
  process.exit(1);
}

start();
