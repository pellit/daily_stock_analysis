import type { UiLanguage } from '../i18n/uiText';

const DATE_LOCALE: Record<UiLanguage, string> = {
  zh: 'zh-CN',
  en: 'en-US',
};

const REPORT_TYPE_LABELS: Record<UiLanguage, Record<string, string>> = {
  zh: { simple: '普通', detailed: '标准', full: '完整', brief: '简版', market_review: '大盘' },
  en: { simple: 'Simple', detailed: 'Detailed', full: 'Full', brief: 'Brief', market_review: 'Market Review' },
};

export const formatDateTime = (
  value?: string | null,
  language: UiLanguage = 'en',
): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(DATE_LOCALE[language], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatDate = (
  value?: string,
  language: UiLanguage = 'en',
): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(DATE_LOCALE[language], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns the date N days ago as YYYY-MM-DD in Asia/Shanghai timezone.
 * Consistent with getTodayInShanghai() so both ends of the date range
 * are expressed in the same timezone as the backend.
 */
export const getRecentStartDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(date);
};

/**
 * Returns today's date as YYYY-MM-DD in Asia/Shanghai timezone.
 * Use this instead of the browser-local date for market-day UI semantics.
 */
export const getTodayInShanghai = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());

export const formatReportType = (
  value?: string,
  language: UiLanguage = 'en',
): string => {
  if (!value) return '—';
  return REPORT_TYPE_LABELS[language][value] ?? value;
};
