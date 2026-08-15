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