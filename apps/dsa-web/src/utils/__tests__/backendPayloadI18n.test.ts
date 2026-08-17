import { describe, expect, it } from 'vitest';
import {
  containsChinese,
  translateBackendPayload,
} from '../backendPayloadI18n';

describe('translateBackendPayload', () => {
  it('rewrites known watchlist messages', () => {
    expect(translateBackendPayload('已加入 600519')).toBe('Added 600519 to the watchlist');
    expect(translateBackendPayload('已移除 00700')).toBe('Removed 00700 from the watchlist');
  });

  it('rewrites market-review task labels', () => {
    expect(translateBackendPayload('大盘复盘')).toBe('Market Review');
    expect(translateBackendPayload('大盘复盘任务已提交')).toBe('Market review task submitted');
    expect(translateBackendPayload('大盘复盘任务已提交，完成后会保存报告并按配置推送通知')).toBe(
      'Market review task submitted; the report will be saved and notifications dispatched per config',
    );
  });

  it('rewrites analysis task queue messages', () => {
    expect(translateBackendPayload('分析任务已加入队列: 600519')).toBe('Analysis task queued: 600519');
    expect(translateBackendPayload('已提交 3 个任务，1 个重复跳过')).toBe('Submitted 3 task(s); 1 duplicate(s) skipped');
  });

  it('rewrites SSE error and notification channel messages', () => {
    expect(translateBackendPayload('分析超时')).toBe('Analysis timed out');
    expect(translateBackendPayload('未配置通知渠道，请先在设置中配置')).toBe(
      'No notification channels configured. Please configure them in Settings first.',
    );
  });

  it('rewrites notification-test defaults', () => {
    expect(translateBackendPayload('DSA 通知测试')).toBe('DSA notification test');
    expect(translateBackendPayload('这是一条来自 DSA Web 设置页的通知测试消息。')).toBe(
      'This is a test notification message from the DSA Web settings page.',
    );
  });

  it('passes English text through untouched', () => {
    expect(translateBackendPayload('Added 600519 to the watchlist')).toBe('Added 600519 to the watchlist');
    expect(translateBackendPayload('Market Review')).toBe('Market Review');
  });

  it('rewrites setup-status check titles', () => {
    expect(translateBackendPayload('LLM 主渠道')).toBe('LLM Primary Channel');
    expect(translateBackendPayload('Agent 渠道')).toBe('Agent Channel');
    expect(translateBackendPayload('自选股')).toBe('Watchlist');
    expect(translateBackendPayload('通知渠道')).toBe('Notification Channels');
    expect(translateBackendPayload('数据库 / 本地存储')).toBe('Database / Local Storage');
  });

  it('rewrites setup-status LLM-primary check messages', () => {
    expect(translateBackendPayload('已启用 Codex CLI 本地生成 Backend（experimental/limited）。')).toBe(
      'Local generation backend Codex CLI is enabled (experimental/limited).',
    );
    expect(translateBackendPayload('已选择 codex_cli，但 DSA 后端进程当前 PATH 中找不到 codex 可执行文件。')).toBe(
      "codex_cli is selected, but the codex executable was not found in the DSA backend's current PATH.",
    );
    expect(translateBackendPayload('已选择 local_cli，但未找到 local_cli_backend 可执行文件。')).toBe(
      'local_cli is selected, but the local_cli_backend executable was not found.',
    );
    expect(translateBackendPayload('已检测到 显式主模型: gpt-4o-mini')).toBe('Explicit primary model detected: gpt-4o-mini');
    expect(translateBackendPayload('已检测到 legacy provider: gemini-pro')).toBe('legacy provider detected: gemini-pro');
    expect(translateBackendPayload('请配置 LITELLM_MODEL、LLM_CHANNELS、LITELLM_CONFIG 或 legacy provider API Key。')).toBe(
      'Configure LITELLM_MODEL, LLM_CHANNELS, LITELLM_CONFIG, or a legacy provider API key.',
    );
  });

  it('rewrites setup-status agent check messages', () => {
    expect(translateBackendPayload('Agent 工具调用暂不支持 codex_cli text-only backend。')).toBe(
      'Agent tool calling does not support the codex_cli text-only backend.',
    );
    expect(translateBackendPayload('已配置 Agent 主模型: gpt-4o-mini')).toBe('Agent primary model configured: gpt-4o-mini');
    expect(translateBackendPayload('普通分析使用 Codex CLI；Agent 工具调用仍使用 LiteLLM 主模型: gpt-4o-mini')).toBe(
      'Normal analysis uses Codex CLI; Agent tool calling still uses the LiteLLM primary model: gpt-4o-mini',
    );
    expect(translateBackendPayload('Agent 主模型 gpt-4o-mini 缺少可用渠道或匹配的 API Key。')).toBe(
      'Agent primary model gpt-4o-mini is missing an available channel or matching API key.',
    );
  });

  it('rewrites setup-status stock-list check messages', () => {
    expect(translateBackendPayload('已配置 5 只股票。')).toBe('5 stock(s) configured.');
    expect(translateBackendPayload('当前 STOCK_LIST 为空。')).toBe('STOCK_LIST is currently empty.');
  });

  it('rewrites market-review top-level heading', () => {
    expect(translateBackendPayload('## 2026-08-17 大盘复盘')).toBe('## 2026-08-17 Market Review');
    expect(translateBackendPayload('## 2026-08-17 A股市场复盘')).toBe('## 2026-08-17 A-share Market Review');
    expect(translateBackendPayload('## 2026-08-17 A 股市场复盘')).toBe('## 2026-08-17 A-share Market Review');
  });

  it('rewrites market-review chapter headings', () => {
    expect(translateBackendPayload('### 一、盘面总览')).toBe('### 1. Market Summary');
    expect(translateBackendPayload('### 二、指数结构')).toBe('### 2. Index Commentary');
    expect(translateBackendPayload('### 三、板块主线')).toBe('### 3. Sector / Theme Highlights');
    expect(translateBackendPayload('### 四、资金与情绪')).toBe('### 4. Funds & Sentiment');
    expect(translateBackendPayload('### 五、消息催化')).toBe('### 5. News Catalysts');
    expect(translateBackendPayload('### 六、策略框架')).toBe('### 6. Strategy Framework');
    expect(translateBackendPayload('### 七、风险提示')).toBe('### 7. Risk Disclosure');
  });

  it('rewrites market-review subsection headings', () => {
    expect(translateBackendPayload('#### 行业板块领涨 Top 5')).toBe('#### Industry Sector Leaders Top 5');
    expect(translateBackendPayload('#### 行业板块领跌 Top 5')).toBe('#### Industry Sector Laggards Top 5');
    expect(translateBackendPayload('#### 概念板块领涨 Top 5')).toBe('#### Concept Theme Leaders Top 5');
    expect(translateBackendPayload('#### 概念板块领跌 Top 5')).toBe('#### Concept Theme Laggards Top 5');
  });

  it('rewrites market-review section labels', () => {
    expect(translateBackendPayload('## 市场概况')).toBe('## Market Overview');
    expect(translateBackendPayload('## 数据边界')).toBe('## Data Limits');
    expect(translateBackendPayload('## 市场新闻')).toBe('## Market News');
  });

  it('rewrites market-review table column headers (multiple per markdown)', () => {
    const table = '| 指标 | 数值 | 观察 |\n| 上涨/下跌/平盘 | 4335 | 上涨占比(不含平盘) 80.3% |';
    expect(translateBackendPayload(table)).toBe(
      '| Metric | Value | Observation |\n| Advancers/Decliners/Flat | 4335 | Up ratio (excluding flat) 80.3% |',
    );
  });

  it('rewrites market-review table column headers for indices', () => {
    const table = '| 指数 | 最新 | 涨跌幅 | 开盘 | 最高 | 最低 | 振幅 | 成交额(亿) |';
    expect(translateBackendPayload(table)).toBe(
      '| Index | Last | Change% | Open | High | Low | Amplitude | Turnover (亿) |',
    );
  });

  it('rewrites market-review bold inline labels', () => {
    expect(translateBackendPayload('**盘面信号**：83/100')).toBe('**Market signal**: 83/100');
    expect(translateBackendPayload('**信号依据**：上涨家数占比 80%')).toBe('**Signal basis**: 上涨家数占比 80%');
    expect(translateBackendPayload('**趋势结构**: 判断市场处于上升阶段。')).toBe('**Trend structure**: 判断市场处于上升阶段。');
  });

  it('rewrites market-review inline labels without bold', () => {
    expect(translateBackendPayload('盘面信号：')).toBe('Market signal: ');
    expect(translateBackendPayload('信号依据：')).toBe('Signal basis: ');
    expect(translateBackendPayload('操作建议：')).toBe('Action advice: ');
  });

  it('rewrites market-review LLM prose intro patterns', () => {
    // The dictionary translates the structural connector phrases
    // (今日A股市场整体呈现, 优先观察, 指数承接，...) but leaves the LLM's
    // free-form mood words (态势, 强势上涨) untouched. Translating free-form
    // prose is out of scope — the canonical fix is to regenerate the report
    // with report_language='en'.
    expect(translateBackendPayload('今日A股市场整体呈现**强势上涨**态势，优先观察指数承接、成交额变化和板块持续性。')).toBe(
      "Today's A-share market overall showed**强势上涨**态势; prioritize observing index support, turnover changes, and sector persistence。",
    );
  });

  it('rewrites market-review stats labels', () => {
    expect(translateBackendPayload('涨停/跌停')).toBe('Limit-up/Limit-down');
    expect(translateBackendPayload('涨跌停差 +105')).toBe('Limit up/down diff +105');
    expect(translateBackendPayload('高活跃度')).toBe('High activity');
  });

  it('rewrites market-review mood descriptors', () => {
    expect(translateBackendPayload('（强势，可进攻）')).toBe('(strong, can attack)');
    expect(translateBackendPayload('（偏暖）')).toBe('(warming)');
    expect(translateBackendPayload('（震荡）')).toBe('(choppy)');
  });

  it('rewrites market-review data-absence fallbacks', () => {
    expect(translateBackendPayload('暂无指数数据。')).toBe('No index data.');
    expect(translateBackendPayload('暂无板块涨跌榜数据。')).toBe('No sector ranking data.');
    expect(translateBackendPayload('暂无市场宽度数据。')).toBe('No market breadth data.');
    expect(translateBackendPayload('暂无相关新闻。')).toBe('No related news.');
  });

  it('rewrites market-review sector labels', () => {
    expect(translateBackendPayload('行业领涨:')).toBe('Industry leading:');
    expect(translateBackendPayload('行业领跌:')).toBe('Industry lagging:');
    expect(translateBackendPayload('概念领涨:')).toBe('Concept leading:');
    expect(translateBackendPayload('概念领跌:')).toBe('Concept lagging:');
  });

  it('rewrites market-review risk disclosure and footer', () => {
    expect(translateBackendPayload('市场有风险，投资需谨慎。')).toBe('Market conditions carry risk; invest with caution.');
    expect(translateBackendPayload('以上数据仅供参考，不构成投资建议。')).toBe(
      'The data above is for reference only and does not constitute investment advice.',
    );
    expect(translateBackendPayload('*复盘时间: 17:46*')).toBe('*Review Time: 17:46*');
  });

  it('rewrites a full market-review markdown body', () => {
    const input = [
      '# 🎯 大盘复盘',
      '## 2026-08-17 大盘复盘',
      '',
      '> 今日A股市场整体呈现**强势上涨**态势，优先观察指数承接、成交额变化和板块持续性。',
      '',
      '### 一、盘面总览',
      '- **盘面信号**：83/100（强势，可进攻）',
      '',
      '### 二、指数结构',
      '| 指标 | 数值 | 观察 |',
      '|------|------|------|',
      '| 上涨/下跌/平盘 | 4335 / 1063 / 140 | 上涨占比(不含平盘) 80.3% |',
      '',
      '### 七、风险提示',
      '- 市场有风险，投资需谨慎。以上数据仅供参考，不构成投资建议。',
      '',
      '*复盘时间: 17:46*',
    ].join('\n');
    expect(translateBackendPayload(input)).toBe(
      [
        '# 🎯 大盘复盘',
        '## 2026-08-17 Market Review',
        '',
        "> Today's A-share market overall showed**强势上涨**态势; prioritize observing index support, turnover changes, and sector persistence。",
        '',
        '### 1. Market Summary',
        '- **Market signal**: 83/100(strong, can attack)',
        '',
        '### 2. Index Commentary',
        '| Metric | Value | Observation |',
        '|------|------|------|',
        '| Advancers/Decliners/Flat | 4335 / 1063 / 140 | Up ratio (excluding flat) 80.3% |',
        '',
        '### 7. Risk Disclosure',
        '- Market conditions carry risk; invest with caution.The data above is for reference only and does not constitute investment advice.',
        '',
        '*Review Time: 17:46*',
      ].join('\n'),
    );
  });


  it('rewrites setup-status notification and storage check messages', () => {
    expect(translateBackendPayload('已检测到至少一个通知渠道配置。')).toBe(
      'At least one notification channel configuration has been detected.',
    );
    expect(translateBackendPayload('通知为可选项，未配置也不影响首次跑通。')).toBe(
      'Notification channels are optional; the first smoke run is not blocked when they are unconfigured.',
    );
    expect(translateBackendPayload('数据库路径父目录不可用: /data/missing')).toBe(
      'Database path parent directory is unavailable: /data/missing',
    );
    expect(translateBackendPayload('数据库路径可用: /data/stock_analysis.db')).toBe(
      'Database path is available: /data/stock_analysis.db',
    );
  });

  it('returns empty string for null/undefined', () => {
    expect(translateBackendPayload(null)).toBe('');
    expect(translateBackendPayload(undefined)).toBe('');
  });
});

describe('containsChinese', () => {
  it('detects CJK characters', () => {
    expect(containsChinese('大盘复盘')).toBe(true);
    expect(containsChinese('已加入 600519')).toBe(true);
  });

  it('returns false for empty or English text', () => {
    expect(containsChinese('')).toBe(false);
    expect(containsChinese(null)).toBe(false);
    expect(containsChinese(undefined)).toBe(false);
    expect(containsChinese('Market Review')).toBe(false);
  });
});