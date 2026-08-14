import type {
  PortfolioCashDirection,
  PortfolioCorporateActionType,
  PortfolioFxRefreshResponse,
  PortfolioImportCommitResponse,
  PortfolioImportParseResponse,
  PortfolioPositionItem,
  PortfolioSide,
} from '../types/portfolio';
import type { UiLanguage } from '../i18n/uiText';
import { toDateInputValue } from './format';

export type FxRefreshFeedback = {
  tone: 'neutral' | 'success' | 'warning';
  text: string;
};

export type PortfolioAlertVariant = 'info' | 'success' | 'warning' | 'danger';

const MONEY_LOCALE: Record<UiLanguage, string> = {
  zh: 'en-US', en: 'en-US',
};

const PRICE_LABEL: Record<UiLanguage, {
  missing: string;
  realtime: string;
  historyClose: string;
  unknown: string;
}> = {
  zh: { missing: 'Price unavailable', realtime: 'Live price', historyClose: 'Closing price', unknown: 'Unknown source' }, en: { missing: 'Price unavailable', realtime: 'Live price', historyClose: 'Closing price', unknown: 'Unknown source' },
};

const SIDE_LABEL: Record<UiLanguage, Record<PortfolioSide, string>> = {
  zh: { buy: 'Buy', sell: 'Sell' }, en: { buy: 'Buy', sell: 'Sell' },
};

const CASH_DIRECTION_LABEL: Record<UiLanguage, Record<PortfolioCashDirection, string>> = {
  zh: { in: 'Inflow', out: 'Outflow' }, en: { in: 'Inflow', out: 'Outflow' },
};

const CORPORATE_ACTION_LABEL: Record<UiLanguage, Record<PortfolioCorporateActionType, string>> = {
  zh: { cash_dividend: 'Cash dividend', split_adjustment: 'Split adjustment' }, en: { cash_dividend: 'Cash dividend', split_adjustment: 'Split adjustment' },
};

const BROKER_DISPLAY_NAME: Record<UiLanguage, Record<string, string>> = {
  zh: { huatai: 'Huatai', citic: 'CITIC', cmb: 'CMB' }, en: { huatai: 'Huatai', citic: 'CITIC', cmb: 'CMB' },
};

export function getTodayIso(): string {
  return toDateInputValue(new Date());
}

export function formatMoney(
  value: number | undefined | null,
  currency = 'CNY',
  language: UiLanguage = 'en',
): string {
  if (value == null || Number.isNaN(value)) return '--';
  return `${currency} ${Number(value).toLocaleString(MONEY_LOCALE[language], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPct(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return '--';
  return `${value.toFixed(2)}%`;
}

export function formatSignedPct(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function hasPositionPrice(row: PortfolioPositionItem): boolean {
  return row.priceAvailable !== false && row.priceSource !== 'missing';
}

export function formatPositionPrice(row: PortfolioPositionItem): string {
  if (!hasPositionPrice(row)) return '--';
  return row.lastPrice.toFixed(4);
}

export function formatPositionMoney(
  value: number,
  row: PortfolioPositionItem,
  language: UiLanguage = 'en',
): string {
  if (!hasPositionPrice(row)) return '--';
  return formatMoney(value, row.valuationCurrency, language);
}

export function getPositionPriceLabel(
  row: PortfolioPositionItem,
  language: UiLanguage = 'en',
): string {
  const labels = PRICE_LABEL[language];
  if (!hasPositionPrice(row)) return labels.missing;
  if (row.priceSource === 'realtime_quote') {
    return row.priceProvider ? `${labels.realtime} · ${row.priceProvider}` : labels.realtime;
  }
  if (row.priceSource === 'history_close') {
    return row.priceStale && row.priceDate ? `${labels.historyClose} · ${row.priceDate}` : labels.historyClose;
  }
  return row.priceSource || labels.unknown;
}

export function formatSideLabel(
  value: PortfolioSide,
  language: UiLanguage = 'en',
): string {
  return SIDE_LABEL[language][value];
}

export function formatCashDirectionLabel(
  value: PortfolioCashDirection,
  language: UiLanguage = 'en',
): string {
  return CASH_DIRECTION_LABEL[language][value];
}

export function formatCorporateActionLabel(
  value: PortfolioCorporateActionType,
  language: UiLanguage = 'en',
): string {
  return CORPORATE_ACTION_LABEL[language][value];
}

export function formatBrokerLabel(
  value: string,
  displayName?: string,
  language: UiLanguage = 'en',
): string {
  if (displayName && displayName.trim()) return `${value}（${displayName.trim()}）`;
  const localized = BROKER_DISPLAY_NAME[language][value];
  if (localized) return `${value}（${localized}）`;
  return value;
}

const FX_REFRESH_DISABLED: Record<UiLanguage, string> = {
  zh: 'Online FX refresh is disabled.', en: 'Online FX refresh is disabled.',
};

const FX_REFRESH_NO_PAIRS: Record<UiLanguage, string> = {
  zh: 'No FX pairs available to refresh in the current scope.', en: 'No FX pairs available to refresh in the current scope.',
};

export function buildFxRefreshFeedback(
  data: PortfolioFxRefreshResponse,
  language: UiLanguage = 'en',
): FxRefreshFeedback {
  if (data.refreshEnabled === false) {
    return {
      tone: 'neutral',
      text: FX_REFRESH_DISABLED[language],
    };
  }

  if (data.pairCount === 0) {
    return {
      tone: 'neutral',
      text: FX_REFRESH_NO_PAIRS[language],
    };
  }

  const pairWord = language === 'en' ? 'pair' : '对';
  const updatedLine = language === 'en'
    ? `FX refreshed: ${data.updatedCount} ${data.pairWord}${data.updatedCount === 1 ? '' : 's'} updated.`
    : `汇率已刷新，共更新 ${data.updatedCount} ${pairWord}。`;
  const partialLine = language === 'en'
    ? `Updated ${data.updatedCount} ${pairWord}${data.updatedCount === 1 ? '' : 's'}, ${data.staleCount} stale, ${data.errorCount} failed.`
    : `更新 ${data.updatedCount} ${pairWord}，仍过期 ${data.staleCount} ${pairWord}，失败 ${data.errorCount} ${pairWord}。`;

  if (data.updatedCount > 0 && data.staleCount === 0 && data.errorCount === 0) {
    return {
      tone: 'success',
      text: updatedLine,
    };
  }

  const summary = partialLine;
  const fallbackWarning = language === 'en'
    ? `Some currency pairs still use stale/fallback rates. ${summary}`
    : `已尝试刷新，但仍有部分货币对使用 stale/fallback 汇率。${summary}`;
  const incompleteWarning = language === 'en'
    ? `Online refresh did not fully succeed. ${summary}`
    : `在线刷新未完全成功。${summary}`;

  if (data.staleCount > 0) {
    return {
      tone: 'warning',
      text: fallbackWarning,
    };
  }

  return {
    tone: 'warning',
    text: incompleteWarning,
  };
}

export function getFxRefreshFeedbackVariant(tone: FxRefreshFeedback['tone']): PortfolioAlertVariant {
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  return 'info';
}

export function getCsvParseVariant(result: PortfolioImportParseResponse): PortfolioAlertVariant {
  return result.errorCount > 0 || result.skippedCount > 0 ? 'warning' : 'info';
}

export function getCsvCommitVariant(result: PortfolioImportCommitResponse, isDryRun: boolean): PortfolioAlertVariant {
  if (isDryRun) return 'info';
  return result.failedCount > 0 || result.duplicateCount > 0 ? 'warning' : 'success';
}
