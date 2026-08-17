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

  // =====================================================
  // Market-review report structural phrases
  // =====================================================
  // Cached Chinese-tagged market-review reports (analysis_history rows
  // whose raw_result / context_snapshot was generated before the
  // report_language='en' default) contain chapter headings, section
  // labels, table column headers, and inline structural phrases in the
  // markdown body. Translate them at display time so the legacy cache
  // renders in English without needing a purge. The canonical fix is to
  // regenerate the report with report_language='en'; once new reports
  // exist, this rewriter is a no-op for them.

  // Top-level heading (date + market review)
  { from: /^## (\d{4}-\d{2}-\d{2}) 大盘复盘$/gm, to: '## $1 Market Review' },
  { from: /^## (\d{4}-\d{2}-\d{2}) A股市场复盘$/gm, to: '## $1 A-share Market Review' },
  { from: /^## (\d{4}-\d{2}-\d{2}) A 股市场复盘$/gm, to: '## $1 A-share Market Review' },
  { from: /^## 大盘复盘$/gm, to: '## Market Review' },
  { from: /^## A股市场复盘$/gm, to: '## A-share Market Review' },
  { from: /^## A 股市场复盘$/gm, to: '## A-share Market Review' },

  // Chapter headings (### xxx)
  { from: /^### 一、盘面总览$/gm, to: '### 1. Market Summary' },
  { from: /^### 一、市场总结$/gm, to: '### 1. Market Summary' },
  { from: /^### 二、指数结构$/gm, to: '### 2. Index Commentary' },
  { from: /^### 二、指数点评$/gm, to: '### 2. Index Commentary' },
  { from: /^### 二、主要指数$/gm, to: '### 2. Index Commentary' },
  { from: /^### 三、板块主线$/gm, to: '### 3. Sector / Theme Highlights' },
  { from: /^### 三、热点解读$/gm, to: '### 3. Sector / Theme Highlights' },
  { from: /^### 三、板块表现$/gm, to: '### 3. Sector / Theme Highlights' },
  { from: /^### 四、资金与情绪$/gm, to: '### 4. Funds & Sentiment' },
  { from: /^### 四、资金动向$/gm, to: '### 4. Funds & Sentiment' },
  { from: /^### 五、消息催化$/gm, to: '### 5. News Catalysts' },
  { from: /^### 五、后市展望$/gm, to: '### 5. Outlook' },
  { from: /^### 六、策略框架$/gm, to: '### 6. Strategy Framework' },
  { from: /^### 七、风险提示$/gm, to: '### 7. Risk Disclosure' },

  // Subsection headings (#### 行业板块领涨 Top 5)
  { from: /^#### 行业板块领涨 Top 5$/gm, to: '#### Industry Sector Leaders Top 5' },
  { from: /^#### 行业板块领跌 Top 5$/gm, to: '#### Industry Sector Laggards Top 5' },
  { from: /^#### 概念板块领涨 Top 5$/gm, to: '#### Concept Theme Leaders Top 5' },
  { from: /^#### 概念板块领跌 Top 5$/gm, to: '#### Concept Theme Laggards Top 5' },

  // Section labels (## xxx - smaller headers used in the data block)
  { from: /^## 指数$/gm, to: '## Index' },
  { from: /^## 行业板块$/gm, to: '## Industry Sectors' },
  { from: /^## 概念板块$/gm, to: '## Concept Themes' },
  { from: /^## 板块表现$/gm, to: '## Sector Performance' },
  { from: /^## 市场概况$/gm, to: '## Market Overview' },
  { from: /^## 数据边界$/gm, to: '## Data Limits' },
  { from: /^## 市场新闻$/gm, to: '## Market News' },
  { from: /^## 市场宽度$/gm, to: '## Market Breadth' },

  // Table column headers (between pipes, with g flag)
  { from: /\| 指标 \|/g, to: '| Metric |' },
  { from: /\| 数值 \|/g, to: '| Value |' },
  { from: /\| 观察 \|/g, to: '| Observation |' },
  { from: /\| 最新 \|/g, to: '| Last |' },
  { from: /\| 指数 \|/g, to: '| Index |' },
  { from: /\| 涨跌幅 \|/g, to: '| Change% |' },
  { from: /\| 开盘 \|/g, to: '| Open |' },
  { from: /\| 最高 \|/g, to: '| High |' },
  { from: /\| 最低 \|/g, to: '| Low |' },
  { from: /\| 振幅 \|/g, to: '| Amplitude |' },
  { from: /\| 成交额\(亿\) \|/g, to: '| Turnover (亿) |' },
  { from: /\| 成交额 \|/g, to: '| Turnover |' },
  { from: /\| 排名 \|/g, to: '| Rank |' },
  { from: /\| 行业板块 \|/g, to: '| Industry Sector |' },
  { from: /\| 概念板块 \|/g, to: '| Concept Theme |' },

  // Bold inline label: **xxx**:
  { from: /\*\*盘面信号\*\*[:：]/g, to: '**Market signal**: ' },
  { from: /\*\*信号依据\*\*[:：]/g, to: '**Signal basis**: ' },
  { from: /\*\*操作建议\*\*[:：]/g, to: '**Action advice**: ' },
  { from: /\*\*趋势结构\*\*[:：] ?/g, to: '**Trend structure**: ' },
  { from: /\*\*资金情绪\*\*[:：]/g, to: '**Funds & sentiment**: ' },
  { from: /\*\*主线板块\*\*[:：]/g, to: '**Key themes**: ' },

  // Inline label: (without markdown bold)
  { from: /盘面信号：/g, to: 'Market signal: ' },
  { from: /信号依据：/g, to: 'Signal basis: ' },
  { from: /操作建议：/g, to: 'Action advice: ' },

  // LLM prose intro patterns (specific markets first, then generic fallback)
  { from: /今日A股市场整体呈现/g, to: "Today's A-share market overall showed" },
  { from: /今日美股市场整体呈现/g, to: "Today's US market overall showed" },
  { from: /今日港股市场整体呈现/g, to: "Today's HK market overall showed" },
  { from: /今日日股市场整体呈现/g, to: "Today's Japan market overall showed" },
  { from: /今日韩股市场整体呈现/g, to: "Today's Korea market overall showed" },
  { from: /今日(.{0,30})市场整体呈现/g, to: "Today's $1 market overall showed" },
  { from: /，优先观察/g, to: '; prioritize observing ' },
  { from: /指数承接、成交额变化和板块持续性/g, to: 'index support, turnover changes, and sector persistence' },
  { from: /指数承接、消息催化和整体风险状态/g, to: 'index support, news catalysts, and overall risk state' },

  // Stats labels (inline)
  { from: /上涨\/下跌\/平盘/g, to: 'Advancers/Decliners/Flat' },
  { from: /涨停\/跌停/g, to: 'Limit-up/Limit-down' },
  { from: /两市成交额/g, to: 'Total market turnover' },
  { from: /涨跌停差/g, to: 'Limit up/down diff' },
  { from: /上涨占比\(不含平盘\)/g, to: 'Up ratio (excluding flat)' },
  { from: /高活跃度/g, to: 'High activity' },
  { from: /中等活跃度/g, to: 'Moderate activity' },
  { from: /低活跃度/g, to: 'Low activity' },

  // Mood descriptors (in parens)
  { from: /（强势，可进攻）/g, to: '(strong, can attack)' },
  { from: /（偏暖）/g, to: '(warming)' },
  { from: /（震荡）/g, to: '(choppy)' },
  { from: /（偏弱）/g, to: '(weakening)' },
  { from: /（弱势）/g, to: '(weak)' },

  // Data absence
  { from: /暂无指数数据。/g, to: 'No index data.' },
  { from: /暂无板块涨跌榜数据。/g, to: 'No sector ranking data.' },
  { from: /暂无市场宽度数据。/g, to: 'No market breadth data.' },
  { from: /暂无相关新闻。/g, to: 'No related news.' },
  { from: /暂无数据。/g, to: 'No data available.' },
  { from: /当前以主要指数与可用新闻线索评估整体风险状态。/g, to: 'Currently using major indices and available news leads to assess overall risk state.' },

  // Sector label (in data block)
  { from: /行业领涨:/g, to: 'Industry leading:' },
  { from: /行业领跌:/g, to: 'Industry lagging:' },
  { from: /概念领涨:/g, to: 'Concept leading:' },
  { from: /概念领跌:/g, to: 'Concept lagging:' },

  // Funds section prose
  { from: /结合成交额和涨跌家数看，当前更适合等待确认，避免仅凭单一热点追高。/g, to: 'Combined with turnover and advance/decline counts, it is currently better to wait for confirmation and avoid chasing a single hot theme.' },

  // News catalysts prose
  { from: /暂无可用新闻时，应降低对题材持续性的确定性判断。/g, to: 'When no news is available, reduce confidence in the persistence of themes.' },

  // Strategy framework definitions
  { from: /判断市场处于上升、震荡还是防守阶段。/g, to: 'Determine whether the market is in an uptrend, range, or defensive phase.' },
  { from: /识别短线风险偏好与情绪温度。/g, to: 'Identify short-term risk appetite and sentiment temperature.' },
  { from: /提炼可交易主线与规避方向。/g, to: 'Extract tradable themes and areas to avoid.' },

  // Risk disclosure (combined pattern first to preserve sentence boundary space)
  { from: /市场有风险，投资需谨慎。 以上数据仅供参考，不构成投资建议。/g, to: 'Market conditions carry risk; invest with caution. The data above is for reference only and does not constitute investment advice.' },
  { from: /市场有风险，投资需谨慎。/g, to: 'Market conditions carry risk; invest with caution.' },
  { from: /市场有风险，投资需谨慎/g, to: 'Market conditions carry risk; invest with caution' },
  { from: /以上数据仅供参考，不构成投资建议。/g, to: 'The data above is for reference only and does not constitute investment advice.' },
  { from: /以上数据仅供参考，不构成投资建议/g, to: 'The data above is for reference only and does not constitute investment advice' },

  // Footer
  { from: /\*复盘时间: /g, to: '*Review Time: ' },
];

// Compiled regex cache (the source patterns are stable). Preserve the
// original flags so `g` / `gm` patterns actually replace globally — the
// previous compilation stripped them, which silently degraded inline
// rewrites to single-match replacements.
const COMPILED: Array<{ from: RegExp; to: string }> = PHRASE_MAP.map((entry) => ({
  from: new RegExp(entry.from.source, entry.from.flags),
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