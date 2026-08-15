import { describe, expect, it } from 'vitest';
import {
  type DecisionActionLabelMap,
  getDecisionActionLabel,
  getLegacyDecisionAction,
  getDecisionActionTone,
  getLegacyDecisionActionLabel,
} from '../decisionAction';

const englishLabels: DecisionActionLabelMap = {
  buy: 'Buy',
  add: 'Add',
  hold: 'Hold',
  reduce: 'Reduce',
  sell: 'Sell',
  watch: 'Watch',
  avoid: 'Avoid',
  alert: 'Alert',
};

describe('decisionAction helpers', () => {
  it('uses structured action taxonomy before server label and legacy advice text', () => {
    expect(getDecisionActionLabel('avoid', 'Avoid', 'Buy', 'Recommend')).toBe('Avoid');
    expect(getDecisionActionLabel('sell', 'Buy', null, 'Advice', englishLabels)).toBe('Sell');
    expect(getDecisionActionTone('sell', 'Buy', null)).toBe('danger');
    expect(getDecisionActionLabel(null, 'Buy', null, 'Advice', englishLabels)).toBe('Buy');
  });

  it('falls back to the action taxonomy label when actionLabel is absent', () => {
    expect(getDecisionActionLabel('add', null, 'Hold', 'Recommend')).toBe('Add position');
    expect(getDecisionActionLabel('watch', null, 'Hold', 'Advice', englishLabels)).toBe('Watch');
  });

  it('keeps legacy fallback compatible with negated buy advice', () => {
    expect(getLegacyDecisionActionLabel('not RecommendBuy, waitConfirm')).toBe('Avoid');
    expect(getDecisionActionLabel(null, null, '避免Buy', 'Recommend')).toBe('Avoid');
    expect(getLegacyDecisionActionLabel('暂not Buy, waitConfirm')).toBe('Avoid');
    expect(getLegacyDecisionActionLabel('firstnot build position, waitvolume')).toBe('Avoid');
    expect(getLegacyDecisionActionLabel(' none needBuy, waitConfirm')).toBe('Avoid');
    expect(getLegacyDecisionActionLabel(' none 须build position, ContinueWatch')).toBe('Avoid');
    expect(getLegacyDecisionActionLabel(' none needLayout, waitBreakout')).toBe('Avoid');
    expect(getLegacyDecisionActionLabel('no buy until breakout')).toBe('Avoid');
    expect(getLegacyDecisionActionLabel('no need to buy before confirmation')).toBe('Avoid');
    expect(getLegacyDecisionActionLabel('cannot buy before confirmation')).toBe('Avoid');
    expect(getLegacyDecisionActionLabel("can't buy before confirmation")).toBe('回避');
    expect(getLegacyDecisionActionLabel('not a buy yet')).toBe('Avoid');
    expect(getLegacyDecisionActionLabel('not a buy yet', englishLabels)).toBe('Avoid');
    expect(getLegacyDecisionActionLabel('not to buy', englishLabels)).toBe('Avoid');
    expect(getLegacyDecisionActionLabel('avoid buying', englishLabels)).toBe('Avoid');
    expect(getLegacyDecisionActionLabel('avoid buying into weakness', englishLabels)).toBe('Avoid');
    expect(getLegacyDecisionActionLabel('waiting to buy')).toBeNull();
  });

  it('keeps legacy fallback compatible with negated sell and add advice', () => {
    expect(getLegacyDecisionActionLabel('not RecommendSell, ContinueWatch')).toBe('Hold');
    expect(getLegacyDecisionActionLabel('洗盘Watch')).toBe('Hold');
    expect(getLegacyDecisionActionLabel('洗盘Watch', englishLabels)).toBe('Hold');
    expect(getLegacyDecisionActionLabel(' none needReduce position, maintainPosition')).toBe('Hold');
    expect(getLegacyDecisionActionLabel(' none 须Reduce position, maintainPosition')).toBe('Hold');
    expect(getLegacyDecisionActionLabel('not RecommendAdd position, waitpullback')).toBe('Hold');
    expect(getLegacyDecisionActionLabel(' none 须Add position, waitpullback')).toBe('Hold');
    expect(getLegacyDecisionActionLabel('no add before confirmation')).toBe('Hold');
    expect(getLegacyDecisionActionLabel('cannot add before confirmation')).toBe('Hold');
    expect(getLegacyDecisionActionLabel('no need to accumulate here')).toBe('Hold');
    expect(getLegacyDecisionActionLabel("can't accumulate here")).toBe('持有');
    expect(getLegacyDecisionActionLabel('no sell before earnings')).toBe('Hold');
    expect(getLegacyDecisionActionLabel('cannot sell before earnings')).toBe('Hold');
    expect(getLegacyDecisionActionLabel('no need to reduce exposure')).toBe('Hold');
    expect(getLegacyDecisionActionLabel("can't reduce exposure")).toBe('持有');
    expect(getLegacyDecisionActionLabel('no trim while trend holds')).toBe('Hold');
    expect(getLegacyDecisionActionLabel('cannot trim while trend holds')).toBe('Hold');
    expect(getLegacyDecisionActionLabel('not a sell yet')).toBe('Hold');
    expect(getLegacyDecisionActionLabel('not a trim yet')).toBe('Hold');
    expect(getLegacyDecisionActionLabel('not to sell')).toBe('Hold');
    expect(getLegacyDecisionActionLabel('not to trim')).toBe('Hold');
    expect(getLegacyDecisionActionLabel('not a trim yet', englishLabels)).toBe('Hold');
    expect(getLegacyDecisionActionLabel('avoid selling into weakness', englishLabels)).toBe('Hold');
    expect(getLegacyDecisionActionLabel('avoid trimming before earnings', englishLabels)).toBe('Hold');
    expect(getLegacyDecisionActionLabel('avoid reducing exposure before earnings', englishLabels)).toBe('Hold');
    expect(getDecisionActionTone(null, null, 'not RecommendSell, ContinueWatch')).toBe('success');
  });

  it('does not turn ambiguous English advice into a badge action', () => {
    expect(getLegacyDecisionActionLabel('buy or sell')).toBeNull();
    expect(getDecisionActionLabel(null, null, 'buy or sell', 'Advice', englishLabels)).toBe('Advice');
  });

  it('does not match financial compound words as legacy actions', () => {
    expect(getLegacyDecisionActionLabel('no buyback announced', englishLabels)).toBeNull();
    expect(getLegacyDecisionActionLabel('cannot buyback shares now', englishLabels)).toBeNull();
    expect(getLegacyDecisionActionLabel('share buy-back announced', englishLabels)).toBeNull();
    expect(getLegacyDecisionActionLabel('share buy back announced', englishLabels)).toBeNull();
    expect(getLegacyDecisionActionLabel('no selloff risk', englishLabels)).toBeNull();
    expect(getLegacyDecisionActionLabel('not selloff yet', englishLabels)).toBeNull();
    expect(getLegacyDecisionActionLabel('sell-off risk remains low', englishLabels)).toBeNull();
    expect(getLegacyDecisionActionLabel('sell off risk remains low', englishLabels)).toBeNull();
    expect(getLegacyDecisionActionLabel('no sell-off pressure', englishLabels)).toBeNull();
    expect(getDecisionActionLabel(null, null, 'no buyback announced', 'Advice', englishLabels)).toBe('Advice');
    expect(getDecisionActionLabel(null, null, 'no selloff risk', 'Advice', englishLabels)).toBe('Advice');
    expect(getLegacyDecisionActionLabel('no buy until breakout', englishLabels)).toBe('Avoid');
    expect(getLegacyDecisionActionLabel('cannot buy before confirmation', englishLabels)).toBe('Avoid');
    expect(getLegacyDecisionActionLabel('no sell before earnings', englishLabels)).toBe('Hold');
  });

  it('keeps separate action terms next to financial compounds', () => {
    expect(getLegacyDecisionAction('buy after sell-off')).toBe('buy');
    expect(getLegacyDecisionActionLabel('buy after sell-off', englishLabels)).toBe('Buy');
    expect(getLegacyDecisionAction('sell after buy-back rumor')).toBe('sell');
    expect(getLegacyDecisionActionLabel('sell after buy-back rumor', englishLabels)).toBe('Sell');
  });

  it('does not match Chinese financial context words as legacy actions', () => {
    expect(getLegacyDecisionActionLabel('Buy盘增强, ContinueWatch')).toBeNull();
    expect(getLegacyDecisionActionLabel('Sell压缓解, ContinueWatch')).toBeNull();
    expect(getLegacyDecisionActionLabel('Sell方ratingmin歧')).toBeNull();
    expect(getDecisionActionLabel(null, null, 'Buy盘增强, ContinueWatch', 'Recommend')).toBe('Recommend');
    expect(getDecisionActionLabel(null, null, 'Sell压缓解, ContinueWatch', 'Recommend')).toBe('Recommend');
  });

  it('keeps multi-guard legacy advice empty instead of prioritizing avoid or alert', () => {
    expect(getLegacyDecisionActionLabel('risk alert, avoid buying')).toBeNull();
    expect(getLegacyDecisionActionLabel('RiskAlert, 避免Buy')).toBeNull();
    expect(getDecisionActionLabel(null, null, 'risk alert, avoid buying', 'Advice', englishLabels)).toBe('Advice');
    expect(getLegacyDecisionActionLabel('avoid buying', englishLabels)).toBe('Avoid');
    expect(getLegacyDecisionActionLabel('risk alert', englishLabels)).toBe('Alert');
  });

  it('maps action tone without reading legacy text when action is present', () => {
    expect(getDecisionActionTone('buy', null, 'Sell')).toBe('success');
    expect(getDecisionActionTone('reduce', null, 'Buy')).toBe('danger');
    expect(getDecisionActionTone('alert', null, 'Buy')).toBe('warning');
    expect(getDecisionActionTone(null, 'Watch', 'Buy')).toBe('warning');
    expect(getDecisionActionTone(null, 'Sell', 'Buy')).toBe('danger');
    expect(getDecisionActionTone(null, null, 'avoid buying')).toBe('warning');
  });
});
