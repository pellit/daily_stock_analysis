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