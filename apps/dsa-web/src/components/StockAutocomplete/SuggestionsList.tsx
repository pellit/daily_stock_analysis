/**
 * Stock search suggestion list.
 */

import type { CSSProperties } from 'react';
import { useUiLanguage } from '../../contexts/UiLanguageContext';
import type { StockSuggestion } from '../../types/stockIndex';
import { Badge } from '../common';
import { cn } from '../../utils/cn';

export interface SuggestionsListProps {
  /** Suggestion list */
  suggestions: StockSuggestion[];
  /** Highlighted index */
  highlightedIndex: number;
  /** Selection callback */
  onSelect: (suggestion: StockSuggestion) => void;
  /** Mouse hover callback */
  onMouseEnter: (index: number) => void;
  /** Custom style (for Portal fixed positioning) */
  style?: CSSProperties;
}

type MarketKey = 'cn' | 'hk' | 'us' | 'jp' | 'kr' | 'index' | 'etf' | 'bse';

const MARKET_KEY_MAP: Record<string, MarketKey> = {
  CN: 'cn',
  HK: 'hk',
  US: 'us',
  JP: 'jp',
  KR: 'kr',
  INDEX: 'index',
  ETF: 'etf',
  BSE: 'bse',
};

const MARKET_BADGE_CLASS: Record<MarketKey, string> = {
  cn: 'border-danger/25 bg-danger/10 text-danger',
  hk: 'border-success/25 bg-success/10 text-success',
  us: 'border-cyan/25 bg-cyan/10 text-cyan',
  jp: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-500',
  kr: 'border-rose-500/25 bg-rose-500/10 text-rose-500',
  index: 'border-purple/25 bg-purple/10 text-purple',
  etf: 'border-warning/25 bg-warning/10 text-warning',
  bse: 'border-orange-500/25 bg-orange-500/10 text-orange-500',
};

export function SuggestionsList({
  suggestions,
  highlightedIndex,
  onSelect,
  onMouseEnter,
  style,
}: SuggestionsListProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <ul
      id="suggestions-list"
      className="z-[100] border-x border-b rounded-b-lg rounded-t-none max-h-60 overflow-auto"
      style={{
        ...style,
        backgroundColor: 'hsl(var(--card) / 0.85)',
        borderColor: 'var(--border-accent)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3), -4px 0 15px -3px rgba(0, 0, 0, 0.2), 4px 0 15px -3px rgba(0, 0, 0, 0.2)',
      }}
      role="listbox"
    >
      {suggestions.map((suggestion, index) => (
        <li
          key={suggestion.canonicalCode}
          role="option"
          aria-selected={index === highlightedIndex}
          className={cn(
            'px-4 py-1 cursor-pointer flex items-center justify-between',
            'hover:bg-[var(--autocomplete-hover-bg)]/25',
            index === highlightedIndex && 'bg-[var(--autocomplete-hover-bg)]/25',
          )}
          onClick={() => onSelect(suggestion)}
          onMouseEnter={() => onMouseEnter(index)}
        >
          <div className="flex items-center gap-3">
            <MarketBadge market={suggestion.market} />

            <div className="flex flex-col">
              <span className="text-sm font-medium text-primary-text">
                {suggestion.nameZh}
              </span>
              <span className="text-sm text-secondary-text">
                {suggestion.displayCode}
              </span>
            </div>
          </div>

          <MatchTypeBadge matchType={suggestion.matchType} />
        </li>
      ))}
    </ul>
  );
}

function MarketBadge({ market }: { market: string }) {
  const { t } = useUiLanguage();
  const key = MARKET_KEY_MAP[market];

  if (!key) {
    throw new Error(t('stockMarket.unsupportedMarket', { market }));
  }

  return (
    <Badge variant="default" size="sm" className={cn('min-w-[3rem] justify-center shadow-none', MARKET_BADGE_CLASS[key])}>
      {t(`stockMarket.badge.${key}` as const)}
    </Badge>
  );
}

type MatchTypeKey = 'exact' | 'prefix' | 'contains' | 'fuzzy';

const MATCH_TYPE_CLASS: Record<MatchTypeKey, string> = {
  exact: 'border-cyan/25 bg-cyan/10 text-cyan',
  prefix: 'border-purple/25 bg-purple/10 text-purple',
  contains: 'border-warning/25 bg-warning/10 text-warning',
  fuzzy: 'border-border/55 bg-elevated/75 text-muted-text',
};

function MatchTypeBadge({ matchType }: { matchType: string }) {
  const { t } = useUiLanguage();
  const key = (['exact', 'prefix', 'contains', 'fuzzy'] as const).find((candidate) => candidate === matchType) ?? 'fuzzy';

  return (
    <Badge variant="default" size="sm" className={cn('shrink-0 shadow-none', MATCH_TYPE_CLASS[key])}>
      {t(`stockMarket.matchType.${key}` as const)}
    </Badge>
  );
}

export default SuggestionsList;
