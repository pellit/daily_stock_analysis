// Defensive phrase dictionary: maps known Chinese phrases that may leak from
// backend payloads (cached records, legacy data, LLM-generated reports under
// the historical default of report_language='zh') to their English
// equivalents.
//
// This is intentionally narrow and curated — the canonical fix is for the
// backend to send English strings via X-UI-Language / report_language='en'.
// This helper only handles the small set of phrases that have been observed
// in user-facing payloads and whose translation is unambiguous, so it is
// safe to apply as a blanket rewrite.

const PHRASE_MAP: Array<{ from: RegExp; to: string }> = [
  // Notification-test defaults (kept here in case legacy payloads surface them)
  { from: /^DSA 通知测试$/, to: 'DSA notification test' },
  { from: /^这是一条来自 DSA Web 设置页的通知测试消息。$/, to: 'This is a test notification message from the DSA Web settings page.' },

  // Market-review / market-review task labels from legacy task submissions
  { from: /^大盘复盘$/, to: 'Market Review' },
  { from: /^大盘复盘任务已提交$/, to: 'Market review task submitted' },
  { from: /^大盘复盘任务已提交，完成后会保存报告并按配置推送通知$/, to: 'Market review task submitted; the report will be saved and notifications dispatched per config' },

  // Watchlist response messages
  { from: /^已加入 (.+)$/, to: 'Added $1 to the watchlist' },
  { from: /^已移除 (.+)$/, to: 'Removed $1 from the watchlist' },
  { from: /^当前自选队列有 (\d+) 只股票$/, to: 'Current watchlist has $1 stock(s)' },

  // Analysis task accepted-message payloads
  { from: /^分析任务已加入队列: (.+)$/, to: 'Analysis task queued: $1' },
  { from: /^已提交 (\d+) 个任务，(\d+) 个重复跳过$/, to: 'Submitted $1 task(s); $2 duplicate(s) skipped' },

  // SSE error event message
  { from: /^分析超时$/, to: 'Analysis timed out' },

  // Notification channel not configured
  { from: /^未配置通知渠道，请先在设置中配置$/, to: 'No notification channels configured. Please configure them in Settings first.' },
];

// Compiled regex cache (the source patterns are stable).
const COMPILED: Array<{ from: RegExp; to: string }> = PHRASE_MAP.map((entry) => ({
  from: new RegExp(entry.from.source),
  to: entry.to,
}));

/**
 * Rewrite known Chinese phrases in a backend payload string to English.
 *
 * Returns the input unchanged when no entry matches, so callers can safely
 * apply this to any user-facing string (e.g., API messages, notification
 * text, report content). The dictionary only covers phrases whose
 * translation is unambiguous, so blanket replacement is safe.
 */
export function translateBackendPayload(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  let result = value;
  for (const entry of COMPILED) {
    if (entry.from.test(result)) {
      result = result.replace(entry.from, entry.to);
    }
  }
  return result;
}

/**
 * Return true when the input string still contains CJK Unified Ideographs
 * after running `translateBackendPayload`. Useful for log assertions and
 * smoke tests that want to confirm the dictionary caught every phrase.
 */
export function containsChinese(value: string | null | undefined): boolean {
  if (!value) return false;
  return /[一-鿿]/.test(value);
}