import type { DecisionAction } from '../types/analysis';
import {
  ZH_AVOID_BUY_PHRASES,
  ZH_AVOID_HOLD_PHRASES,
  ZH_GUARD_PHRASES,
  ZH_MATCH_PHRASES,
  ZH_TONE_DANGER_CHARS,
  ZH_TONE_SUCCESS_CHARS,
  ZH_TONE_WARNING_CHARS,
} from './decisionAction/zhPhrases';

export type DecisionActionTone = 'success' | 'warning' | 'danger' | 'default';
export type DecisionActionLabelMap = Record<DecisionAction, string>;
export type DecisionActionLabelTextKey =
  | 'history.actionBuy'
  | 'history.actionAdd'
  | 'history.actionHold'
  | 'history.actionReduce'
  | 'history.actionSell'
  | 'history.actionWatch'
  | 'history.actionAvoid'
  | 'history.actionAlert';
export type DecisionActionLabelTranslator = (key: DecisionActionLabelTextKey) => string;

export const DEFAULT_DECISION_ACTION_LABELS: DecisionActionLabelMap = {
  buy: 'Buy',
  add: 'Add',
  hold: 'Hold',
  reduce: 'Reduce',
  sell: 'Sell',
  watch: 'Watch',
  avoid: 'Avoid',
  alert: 'Alert',
};

const resolveActionLabels = (labels?: Partial<DecisionActionLabelMap>): DecisionActionLabelMap => ({
  ...DEFAULT_DECISION_ACTION_LABELS,
  ...labels,
});

export const buildDecisionActionLabelMap = (
  t: DecisionActionLabelTranslator,
): DecisionActionLabelMap => ({
  buy: t('history.actionBuy'),
  add: t('history.actionAdd'),
  hold: t('history.actionHold'),
  reduce: t('history.actionReduce'),
  sell: t('history.actionSell'),
  watch: t('history.actionWatch'),
  avoid: t('history.actionAvoid'),
  alert: t('history.actionAlert'),
});

const toneForAction = (action: DecisionAction): DecisionActionTone => {
  if (action === 'buy' || action === 'add' || action === 'hold') return 'success';
  if (action === 'sell' || action === 'reduce') return 'danger';
  return 'warning';
};

const includesAny = (value: string, phrases: readonly string[]): boolean =>
  phrases.some((phrase) => value.includes(phrase));

const normalizeEnglishAdvice = (value: string): string =>
  value.toLowerCase().replace(/[_-]/g, ' ');

const maskEnglishFinancialCompounds = (value: string): string =>
  value
    .replace(/(^|[^a-z0-9_])buy\s*back(?=$|[^a-z0-9_])/g, '$1financialcompound')
    .replace(/(^|[^a-z0-9_])sell\s*off(?=$|[^a-z0-9_])/g, '$1financialcompound');

const matchesEnglishTerm = (value: string, terms: readonly string[]): boolean =>
  terms.some((term) => new RegExp(`(^|[^a-z0-9_])${term}(?=$|[^a-z0-9_])`).test(value));

const matchesEnglishNegatedAction = (value: string, terms: readonly string[]): boolean => {
  const negationPrefix = String.raw`(?:not\s+(?:a\s+|an\s+|to\s+)?|no\s+(?:need\s+to\s+)?|need\s+not\s+|cannot\s+|can't\s+|cant\s+|do\s+not\s+|don't\s+|dont\s+)`;
  return terms.some((term) =>
    new RegExp(`(^|[^a-z0-9_])${negationPrefix}${term}(?=$|[^a-z0-9_])`).test(value),
  );
};

const hasEnglishAvoidedHoldAction = (value: string): boolean => {
  const terms = String.raw`(?:adding|accumulating|selling|reducing|trimming)`;
  return new RegExp(`(^|[^a-z0-9_])avoid\\s+${terms}(?=$|[^a-z0-9_])`).test(value);
};

const hasEnglishDeferredAction = (value: string): boolean => {
  const terms = String.raw`(?:buy|add|accumulate|sell|reduce|trim)`;
  return (
    new RegExp(`(^|[^a-z0-9_])wait(?:ing)?\\s+to\\s+${terms}(?=$|[^a-z0-9_])`).test(value) ||
    new RegExp(`(^|[^a-z0-9_])waiting\\s+(?:for|until)\\b.*?${terms}(?=$|[^a-z0-9_])`).test(value)
  );
};

export const getLegacyDecisionActionLabel = (
  advice?: string | null,
  labels?: Partial<DecisionActionLabelMap>,
): string | null => {
  const action = getLegacyDecisionAction(advice);
  if (!action) return null;
  return resolveActionLabels(labels)[action];
};

export const getLegacyDecisionAction = (advice?: string | null): DecisionAction | null => {
  const normalized = advice?.trim();
  if (!normalized) return null;
  const lower = maskEnglishFinancialCompounds(normalizeEnglishAdvice(normalized));

  if (hasEnglishDeferredAction(lower)) {
    return null;
  }

  if (
    includesAny(normalized, ZH_AVOID_BUY_PHRASES) ||
    matchesEnglishNegatedAction(lower, ['buy'])
  ) {
    return 'avoid';
  }
  if (
    includesAny(normalized, ZH_AVOID_HOLD_PHRASES) ||
    hasEnglishAvoidedHoldAction(lower) ||
    matchesEnglishNegatedAction(lower, ['add', 'accumulate', 'sell', 'reduce', 'trim'])
  ) {
    return 'hold';
  }
  const guardMatches = new Set<DecisionAction>();
  if (
    includesAny(normalized, ZH_GUARD_PHRASES.avoid) ||
    matchesEnglishTerm(lower, ['avoid'])
  ) {
    guardMatches.add('avoid');
  }
  if (
    includesAny(normalized, ZH_GUARD_PHRASES.alert) ||
    lower.includes('risk alert') ||
    matchesEnglishTerm(lower, ['alert'])
  ) {
    guardMatches.add('alert');
  }
  if (guardMatches.size === 1) {
    return Array.from(guardMatches)[0];
  }
  if (guardMatches.size > 1) {
    return null;
  }

  const matches = new Set<DecisionAction>();
  if (includesAny(normalized, ZH_MATCH_PHRASES.add) || matchesEnglishTerm(lower, ['add', 'accumulate'])) {
    matches.add('add');
  }
  if (includesAny(normalized, ZH_MATCH_PHRASES.reduce) || matchesEnglishTerm(lower, ['reduce', 'trim'])) {
    matches.add('reduce');
  }
  if (includesAny(normalized, ZH_MATCH_PHRASES.sell) || matchesEnglishTerm(lower, ['sell'])) {
    matches.add('sell');
  }
  if (includesAny(normalized, ZH_MATCH_PHRASES.hold) || matchesEnglishTerm(lower, ['hold'])) {
    matches.add('hold');
  }
  if (includesAny(normalized, ZH_MATCH_PHRASES.watch) || matchesEnglishTerm(lower, ['watch', 'wait'])) {
    matches.add('watch');
  }
  if (includesAny(normalized, ZH_MATCH_PHRASES.buy) || matchesEnglishTerm(lower, ['buy'])) {
    matches.add('buy');
  }

  if (matches.size === 1) {
    return Array.from(matches)[0];
  }
  return null;
};

export const getDecisionActionLabel = (
  action?: DecisionAction | null,
  actionLabel?: string | null,
  legacyAdvice?: string | null,
  emptyLabel: string | null = 'Recommend',
  labels?: Partial<DecisionActionLabelMap>,
): string | null => {
  const actionLabels = resolveActionLabels(labels);
  if (action) return actionLabels[action];
  const explicitLabel = actionLabel?.trim();
  if (explicitLabel) return explicitLabel;
  return getLegacyDecisionActionLabel(legacyAdvice, actionLabels) || emptyLabel;
};

export const getDecisionActionTone = (
  action?: DecisionAction | null,
  actionLabel?: string | null,
  legacyAdvice?: string | null,
): DecisionActionTone => {
  if (action) return toneForAction(action);

  const label = actionLabel?.trim() || '';
  if (label) {
    const lowerLabel = normalizeEnglishAdvice(label);
    if (includesAny(label, ZH_TONE_SUCCESS_CHARS)) return 'success';
    if (includesAny(label, ZH_TONE_DANGER_CHARS)) return 'danger';
    if (includesAny(label, ZH_TONE_WARNING_CHARS)) {
      return 'warning';
    }
    if (matchesEnglishTerm(lowerLabel, ['buy', 'add', 'hold'])) return 'success';
    if (matchesEnglishTerm(lowerLabel, ['sell', 'reduce', 'trim'])) return 'danger';
    if (matchesEnglishTerm(lowerLabel, ['watch', 'wait', 'avoid', 'alert'])) return 'warning';
    return 'default';
  }

  const legacyAction = getLegacyDecisionAction(legacyAdvice);
  if (legacyAction) return toneForAction(legacyAction);

  return 'default';
};
