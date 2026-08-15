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

  // Setup-status (first-run setup card on Settings page) titles and messages
  // emitted by the backend's get_setup_status response. The strings flow from
  // src/services/system_config_service.py and may include parameterized values
  // (model names, paths, presets, counts). Anchored with ^...$ so they only
  // rewrite full strings, not substrings inside LLM-generated content.
  { from: /^LLM 主渠道$/, to: 'LLM Primary Channel' },
  { from: /^Agent 渠道$/, to: 'Agent Channel' },
  { from: /^自选股$/, to: 'Watchlist' },
  { from: /^通知渠道$/, to: 'Notification Channels' },
  { from: /^数据库 \/ 本地存储$/, to: 'Database / Local Storage' },

  // Source-label phrases that appear inside the LLM-primary check messages
  // (mapped via the {source_label} parameter, not standalone).
  { from: /显式主模型/, to: 'Explicit primary model' },
  { from: /LiteLLM YAML/, to: 'LiteLLM YAML' },
  { from: /LLM 渠道/, to: 'LLM channel' },

  // LLM-primary check messages
  { from: /^已启用 (.+) 本地生成 Backend（experimental\/limited）。$/, to: 'Local generation backend $1 is enabled (experimental/limited).' },
  { from: /^已选择 codex_cli，但 DSA 后端进程当前 PATH 中找不到 codex 可执行文件。$/, to: 'codex_cli is selected, but the codex executable was not found in the DSA backend\'s current PATH.' },
  { from: /^已选择 (.+)，但未找到 (.+) 可执行文件。$/, to: '$1 is selected, but the $2 executable was not found.' },
  { from: /^请确认 Codex CLI 已安装到后端 PATH 可见目录；桌面端请完全退出并重开。打开 Codex CLI 交互窗口不会改变已运行后端的 PATH；若找到后仍失败，再检查 Codex CLI 登录态，或将 GENERATION_BACKEND 设回 litellm。$/, to: 'Make sure the Codex CLI is installed in a directory visible to the backend\'s PATH; on desktop builds, fully quit and relaunch. Opening the Codex CLI interactive window does not change the running backend\'s PATH. If it still fails, recheck the Codex CLI login state, or set GENERATION_BACKEND back to litellm.' },
  { from: /^请先安装并登录对应 CLI，或将 GENERATION_BACKEND 设回 litellm。$/, to: 'Install and log in to the corresponding CLI first, or set GENERATION_BACKEND back to litellm.' },
  { from: /^已检测到 (.+): (.+)$/, to: '$1 detected: $2' },
  { from: /^请配置 LITELLM_MODEL、LLM_CHANNELS、LITELLM_CONFIG 或 legacy provider API Key。$/, to: 'Configure LITELLM_MODEL, LLM_CHANNELS, LITELLM_CONFIG, or a legacy provider API key.' },

  // Agent-llm check messages
  { from: /^Agent 工具调用暂不支持 (.+) text-only backend。$/, to: 'Agent tool calling does not support the $1 text-only backend.' },
  { from: /^请将 AGENT_GENERATION_BACKEND 设为 auto 或 litellm，并配置 LiteLLM 工具调用渠道。$/, to: 'Set AGENT_GENERATION_BACKEND to auto or litellm, and configure a LiteLLM tool-calling channel.' },
  { from: /^普通分析使用 Codex CLI；但当前 LiteLLM Agent 路径继承的是 Hermes-only 模型，Hermes Phase 3 不支持 Agent 工具调用。$/, to: 'Normal analysis uses Codex CLI, but the current LiteLLM Agent route inherits a Hermes-only model, which Hermes Phase 3 does not support for Agent tool calling.' },
  { from: /^如需使用 Ask-Stock Agent，请配置非 Hermes 的 AGENT_LITELLM_MODEL，或配置包含非 Hermes deployment 的 mixed Agent route。$/, to: 'To use the Ask-Stock Agent, configure a non-Hermes AGENT_LITELLM_MODEL, or configure a mixed Agent route that includes a non-Hermes deployment.' },
  { from: /^普通分析使用 Codex CLI；Agent 工具调用仍使用 LiteLLM 主模型: (.+)$/, to: 'Normal analysis uses Codex CLI; Agent tool calling still uses the LiteLLM primary model: $1' },
  { from: /^AGENT_GENERATION_BACKEND 已选择 litellm，但未检测到可用 LiteLLM 模型配置。$/, to: 'AGENT_GENERATION_BACKEND is set to litellm, but no usable LiteLLM model configuration was detected.' },
  { from: /^如需使用 Ask-Stock Agent，请配置 AGENT_LITELLM_MODEL、LITELLM_MODEL、LLM_CHANNELS 或 LITELLM_CONFIG。$/, to: 'To use the Ask-Stock Agent, configure AGENT_LITELLM_MODEL, LITELLM_MODEL, LLM_CHANNELS, or LITELLM_CONFIG.' },
  { from: /^Agent 工具调用需要 LiteLLM 模型配置；local CLI 主生成方式不会被自动继承。$/, to: 'Agent tool calling requires a LiteLLM model configuration; the local CLI primary generation backend is not inherited automatically.' },
  { from: /^未单独配置 Agent 主模型，将继承 LLM 主渠道。$/, to: 'No dedicated Agent primary model is configured; the LLM primary channel will be used.' },
  { from: /^Hermes Phase 3 不支持 Agent 工具调用，且当前继承的主模型没有非 Hermes deployment。$/, to: 'Hermes Phase 3 does not support Agent tool calling, and the inherited primary model has no non-Hermes deployment.' },
  { from: /^请选择非 Hermes Agent 模型，或配置包含非 Hermes deployment 的 mixed Agent route。$/, to: 'Pick a non-Hermes Agent model, or configure a mixed Agent route that includes a non-Hermes deployment.' },
  { from: /^Agent 未配置独立模型，且 LLM 主渠道尚不可用。$/, to: 'No dedicated Agent model is configured, and the LLM primary channel is not yet available.' },
  { from: /^请先补齐 LLM 主渠道配置。$/, to: 'Complete the LLM primary channel configuration first.' },
  { from: /^Agent 主模型 (.+) 只有 Hermes deployment，Phase 3 不支持 Agent 工具调用。$/, to: 'Agent primary model $1 only has a Hermes deployment; Phase 3 does not support Agent tool calling.' },
  { from: /^已配置 Agent 主模型: (.+)$/, to: 'Agent primary model configured: $1' },
  { from: /^Agent 主模型 (.+) 缺少可用渠道或匹配的 API Key。$/, to: 'Agent primary model $1 is missing an available channel or matching API key.' },
  { from: /^请调整 AGENT_LITELLM_MODEL 或补齐对应渠道配置。$/, to: 'Adjust AGENT_LITELLM_MODEL or complete the corresponding channel configuration.' },

  // Stock-list check messages
  { from: /^已配置 (\d+) 只股票。$/, to: '$1 stock(s) configured.' },
  { from: /^当前 STOCK_LIST 为空。$/, to: 'STOCK_LIST is currently empty.' },
  { from: /^请至少添加 1 只股票用于首次试跑。$/, to: 'Add at least 1 stock for the first smoke run.' },

  // Notification check messages
  { from: /^已检测到至少一个通知渠道配置。$/, to: 'At least one notification channel configuration has been detected.' },
  { from: /^通知为可选项，未配置也不影响首次跑通。$/, to: 'Notification channels are optional; the first smoke run is not blocked when they are unconfigured.' },
  { from: /^需要推送时可稍后配置飞书、钉钉、Telegram、邮件或其他通知渠道。$/, to: 'Configure Feishu, DingTalk, Telegram, email, or other notification channels later when you need push delivery.' },

  // Storage check messages
  { from: /^数据库路径父目录不可用: (.+)$/, to: 'Database path parent directory is unavailable: $1' },
  { from: /^请检查 DATABASE_PATH 或上级目录权限。$/, to: 'Check DATABASE_PATH or the parent directory permissions.' },
  { from: /^数据库路径可用: (.+)$/, to: 'Database path is available: $1' },
  { from: /^数据库上级目录可创建: (.+)$/, to: 'Database parent directory can be created: $1' },
  { from: /^数据库路径上级目录不可写: (.+)$/, to: 'Database path parent directory is not writable: $1' },
  { from: /^请调整 DATABASE_PATH 或目录权限。$/, to: 'Adjust DATABASE_PATH or the directory permissions.' },
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