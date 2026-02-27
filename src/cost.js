/**
 * Token-to-cost calculator per model.
 * Prices in USD per million tokens (as of Feb 2026).
 */

const MODEL_PRICING = {
  'claude-opus-4-6': {
    label: 'Claude Opus 4.6',
    input: 15.0,
    output: 75.0,
    cacheWrite: 18.75,
    cacheRead: 1.50,
  },
  'claude-sonnet-4-6': {
    label: 'Claude Sonnet 4.6',
    input: 3.0,
    output: 15.0,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  'claude-haiku-4-6': {
    label: 'Claude Haiku 4.6',
    input: 0.80,
    output: 4.0,
    cacheWrite: 1.0,
    cacheRead: 0.08,
  },
  'claude-opus-4-5': {
    label: 'Claude Opus 4.5',
    input: 15.0,
    output: 75.0,
    cacheWrite: 18.75,
    cacheRead: 1.50,
  },
  'claude-sonnet-4-5': {
    label: 'Claude Sonnet 4.5',
    input: 3.0,
    output: 15.0,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  'claude-haiku-3-5': {
    label: 'Claude Haiku 3.5',
    input: 0.80,
    output: 4.0,
    cacheWrite: 1.0,
    cacheRead: 0.08,
  },
};

const DEFAULT_PRICING = {
  label: 'Claude',
  input: 3.0,
  output: 15.0,
  cacheWrite: 3.75,
  cacheRead: 0.30,
};

/**
 * Normalize model ID to pricing key.
 */
function normalizeModel(modelId) {
  if (!modelId) return null;
  const lower = modelId.toLowerCase();
  for (const key of Object.keys(MODEL_PRICING)) {
    if (lower.includes(key) || lower === key) return key;
  }
  if (lower.includes('opus')) return 'claude-opus-4-6';
  if (lower.includes('sonnet')) return 'claude-sonnet-4-6';
  if (lower.includes('haiku')) return 'claude-haiku-4-6';
  return null;
}

/**
 * Get pricing info for a model string.
 */
export function getPricing(modelId) {
  const key = normalizeModel(modelId);
  return MODEL_PRICING[key] || DEFAULT_PRICING;
}

/**
 * Calculate cost from usage object.
 * usage: { input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens }
 */
export function calculateCost(usage, modelId) {
  if (!usage) return 0;

  const pricing = getPricing(modelId);
  const M = 1_000_000;

  const inputCost = ((usage.input_tokens || 0) / M) * pricing.input;
  const outputCost = ((usage.output_tokens || 0) / M) * pricing.output;
  const cacheWriteCost = ((usage.cache_creation_input_tokens || 0) / M) * pricing.cacheWrite;
  const cacheReadCost = ((usage.cache_read_input_tokens || 0) / M) * pricing.cacheRead;

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

/**
 * Format cost as readable string.
 */
export function formatCost(usd) {
  if (usd < 0.01) return `~$0.00`;
  if (usd < 1) return `~$${usd.toFixed(2)}`;
  return `$${usd.toFixed(2)}`;
}

/**
 * Format token count with K/M suffix.
 */
export function formatTokens(n) {
  if (!n || n === 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Get human-readable model label.
 */
export function getModelLabel(modelId) {
  if (!modelId) return 'Unknown';
  const key = normalizeModel(modelId);
  return (MODEL_PRICING[key] || DEFAULT_PRICING).label;
}
