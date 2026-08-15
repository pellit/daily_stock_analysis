/**
 * Defensive mapping of legacy Chinese action labels.
 *
 * Active only when the analysis response or imported history record was
 * produced under `report_language=zh`; the English UI does not consult these.
 * Kept in one place so feature code stays readable while preserving the
 * parser's regression coverage for Chinese-tagged history rows.
 */

export const ZH_AVOID_BUY_PHRASES: readonly string[] = [
  '暂不买入',
  '不要买入',
  '不宜买入',
  '先不买入',
  '无需买入',
  '无须买入',
  '不建议建仓',
  '暂不建仓',
  '不要建仓',
  '不宜建仓',
  '先不建仓',
  '无需建仓',
  '无须建仓',
  '不建议布局',
  '暂不布局',
  '不要布局',
  '不宜布局',
  '先不布局',
  '无需布局',
  '无须布局',
];

export const ZH_AVOID_HOLD_PHRASES: readonly string[] = [
  '不建议加仓',
  '无需加仓',
  '无须加仓',
  '不要加仓',
  '不宜加仓',
  '暂不加仓',
  '不建议增持',
  '无需增持',
  '无须增持',
  '不要增持',
  '不宜增持',
  '暂不增持',
  '不建议卖出',
  '无需卖出',
  '无须卖出',
  '不要卖出',
  '不宜卖出',
  '暂不卖出',
  '不建议减仓',
  '无需减仓',
  '无须减仓',
  '不要减仓',
  '不宜减仓',
  '暂不减仓',
  '不建议清仓',
  '无需清仓',
  '无须清仓',
  '不要清仓',
  '不宜清仓',
  '暂不清仓',
];

export const ZH_GUARD_PHRASES: Readonly<Record<'avoid' | 'alert', readonly string[]>> = {
  avoid: ['不建议买入', '避免买入', '回避', '规避'],
  alert: ['风险预警', '触发告警', '警惕'],
};

export const ZH_MATCH_PHRASES: Readonly<Record<'add' | 'reduce' | 'sell' | 'hold' | 'watch' | 'buy', readonly string[]>> = {
  add: ['加仓', '增持'],
  reduce: ['减仓'],
  sell: ['强烈卖出', '卖出', '清仓'],
  hold: ['持有', '洗盘观察'],
  watch: ['观望', '等待'],
  buy: ['强烈买入', '买入', '布局', '建仓'],
};

/**
 * Single-character Chinese tone probes. Used by `getDecisionActionTone` to
 * classify a label as success/danger/warning when the label text is legacy
 * Chinese rather than a structured `DecisionAction`.
 */
export const ZH_TONE_SUCCESS_CHARS: readonly string[] = ['买', '加仓', '持有'];
export const ZH_TONE_DANGER_CHARS: readonly string[] = ['卖', '减仓', '清仓'];
export const ZH_TONE_WARNING_CHARS: readonly string[] = ['观望', '等待', '回避', '预警'];
