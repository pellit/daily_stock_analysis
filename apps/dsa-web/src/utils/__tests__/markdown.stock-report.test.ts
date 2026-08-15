import { describe, expect, it } from 'vitest';
import { markdownToPlainText } from '../markdown';

/**
 * Stock report specific tests for markdownToPlainText
 * Tests real-world stock analysis report scenarios
 */
describe('markdownToPlainText - Stock Report Scenarios', () => {
  it('handles typical Chinese stock report with tables and indicators', () => {
    const stockReport = `# Kweichow Moutai (600519) Analysis report\\n\\n## 技术Analyze\\n\\n| metrics | current | signal |\\n|------|--------|------|\\n| MA5 | 1680.50 | 🟢 |\\n| MA10 | 1675.30 | 🟢 |\\n| MA20 | 1665.80 | 🟢 |\\n\\n**MACD**: golden crosssignal, BuyReference\\n**RSI**: 56.8, 处atneutralregion\\n\\n## FundamentalsAnalyze\\n\\n- **PE**: 28.5\\n- **PB**: 8.2\\n- **revenuegrow**: +15.3% YoY\\n\\n> Riskinfo: short期volatilityCAbig, RecommendControlPosition\\n\\n## ActionRecommend\\n\\n\\\\\\\`\\\\\\\`\\\\\\\`python\\n# Recommend Buyrange\\nentry_zone = [1650, 1680]\\nstop_loss = 1620\\ntarget = 1750\\n\\\\\\\`\\\\\\\`\\\\\\\`\\n\\n[View详细Data](https://example.com/stock/600519)`;

    const result = markdownToPlainText(stockReport);

    // Verify key content is preserved
    expect(result).toContain('Kweichow Moutai');
    expect(result).toContain('600519');
    expect(result).toContain('技术Analyze');
    expect(result).toContain('MACD');
    expect(result).toContain('golden crosssignal');
    expect(result).toContain('PE');
    expect(result).toContain('Riskinfo');
    expect(result).toContain('entry_zone');
    expect(result).toContain('View详细Data');

    // Verify markdown symbols are removed
    expect(result).not.toMatch(/^#{1,6}\s+/m);
    expect(result).not.toMatch(/\*\*[^*]+\*\*/);
    // Note: remove-markdown preserves table structure with pipe characters
    // This is a known limitation - tables remain pipe-separated
  });

  it('handles Hong Kong stock report with English and Chinese mix', () => {
    const hkReport = `# Tencent (00700.HK) Technical Analysis\\n\\n## Key Indicators\\n\\n* **Current Price**: HKD 368.20\\n* **Change**: +2.5% 📈\\n* **Volume**: 18.2M\\n\\n## Support & Resistance\\n\\n1. **Resistance 1**: HKD 375.00\\n2. **Resistance 2**: HKD 380.00\\n3. **Support 1**: HKD 365.00\\n\\n> RecommendatCallbackto 365-368 rangeWatch\\n\\n\\\\\\\`\\\\\\\`\\\\\\\`\\nMA5 > MA10 > MA20 (long排column)\\nRSI(14) = 58.3 (neutralrelatively strong)\\n\\\\\\\`\\\\\\\`\\\\\\\`\\n\\n[Click for more details](https://finance.qq.com/q/go.php/vInvestConsult/stock/00700)`;

    const result = markdownToPlainText(hkReport);

    expect(result).toContain('Tencent');
    expect(result).toContain('00700.HK');
    expect(result).toContain('368.20');
    expect(result).toContain('Resistance 1');
    expect(result).toContain('Support 1');
    expect(result).toContain('RecommendatCallback');
    expect(result).toContain('MA5 > MA10');
    expect(result).toContain('Click for more details');
  });

  it('handles US stock report with financial data', () => {
    const usReport = `# Apple Inc. (AAPL) Analysis Report

## Financial Metrics

| Metric | Value | Change |
|--------|-------|--------|
| Price | $178.35 | +1.2% |
| Market Cap | $2.8T | - |
| P/E Ratio | 28.5 | - |
| EPS | $6.16 | +8.3% |

## Technical Indicators

- **MA50**: $175.20 (Above)
- **MA200**: $168.80 (Above)
- **RSI**: 62.5 (Slightly Overbought)
- **MACD**: Bullish crossover

## Recommendation

***Strong Buy*** with target price of **$195.00**

> Risk: Trade tensions may impact supply chain

\`\`\`javascript
const entryPrice = 178.35;
const stopLoss = 172.00;
const targetPrice = 195.00;
const riskReward = (targetPrice - entryPrice) / (entryPrice - stopLoss);
// Risk/Reward ratio: 2.1:1
\`\`\`

![AAPL Chart](https://example.com/charts/aapl.png)`;

    const result = markdownToPlainText(usReport);

    expect(result).toContain('Apple Inc.');
    expect(result).toContain('AAPL');
    expect(result).toContain('178.35');
    expect(result).toContain('2.8T');
    expect(result).toContain('Strong Buy');
    expect(result).toContain('195.00');
    expect(result).toContain('Risk/Reward ratio');
  });

  it('handles market review report with multiple stocks', () => {
    const marketReview = `# AsharesMarket复盘\\n\\n## Indextable现\\n\\n| Index | close | Change | volume额 |\\n|------|------|--------|--------|\\n| SSEIndex | 3050.32 | +0.85% | 4285100M |\\n| SZSE Component | 9850.45 | +1.12% | 5250100M |\\n| ChiNext指 | 1950.28 | +1.45% | 2180100M |\\n\\n## Hot sector\\n\\n1. **AI** 🤖\\n   - Reason: LLM技术Breakout\\n   - leader: iFlytek, Cambricon\\n\\n2. **EV** 🚗\\n   - Reason: 销amountData超expected\\n   - leader: BYD, Li Auto\\n\\n3. **Semiconductors** 💾\\n   - Reason: Domestic substitutionAccelerating\\n   - leader: SMIC, NAURA\\n\\n## funds流to\\n\\n- **northboundfunds**: +85.5100M\\n- **marginshort**: +32.8100M\\n- **mainstreamfunds**: netInflow 156.8100M\\n\\n## aftermarket展望\\n\\n> expectedtomorrowRangerange: 3040-3065\\n\\n**Strategy**: WatchTechnologymain 线, ControlPosition`;

    const result = markdownToPlainText(marketReview);

    expect(result).toContain('AsharesMarket复盘');
    expect(result).toContain('SSEIndex');
    expect(result).toContain('3050.32');
    expect(result).toContain('AI');
    expect(result).toContain('iFlytek');
    expect(result).toContain('northboundfunds');
    expect(result).toContain('85.5100M');
    expect(result).toContain('3040-3065');
  });

  it('handles report with special characters and formulas', () => {
    const report = `# 技术metricscompute\\n\\n## MACD compute\\n\\n\\\\\\\`\\\\\\\`\\\\\\\`python\\n# MACD = EMA(12) - EMA(26)\\n# Signal = EMA(MACD, 9)\\n# Histogram = MACD - Signal\\n\\ndef calculate_macd(prices, fast=12, slow=26, signal=9):\\n    ema_fast = prices.ewm(span=fast).mean()\\n    ema_slow = prices.ewm(span=slow).mean()\\n    macd = ema_fast - ema_slow\\n    signal_line = macd.ewm(span=signal).mean()\\n    return macd, signal_line\\n\\\\\\\`\\\\\\\`\\\\\\\`\\n\\n## RSI 公form\\n\\n$$RSI = 100 - \\\\frac{100}{1 + RS}$$\\n\\nitsIn progress: \\n- RS = averagegain / averageloss\\n- Horizon: Default 14 day\\n\\n## Bollinger带\\n\\n- **middle band** = MA(20)\\n- **upper band** = MA(20) + 2 × STD(20)\\n- **lower band** = MA(20) - 2 × STD(20)\\n\\n> currentPriceatupper bandAttachednear, NoteCallbackRisk`;

    const result = markdownToPlainText(report);

    expect(result).toContain('MACD compute');
    expect(result).toContain('EMA(12) - EMA(26)');
    expect(result).toContain('RSI');
    expect(result).toContain('Bollinger带');
    expect(result).toContain('MA(20)');
    expect(result).toContain('NoteCallbackRisk');
  });

  it('handles report with code snippets in multiple languages', () => {
    const report = `# StrategyBacktest代码\\n\\n## Python Strategy\\n\\n\\\\\\\`\\\\\\\`\\\\\\\`python\\nimport pandas as pd\\nimport numpy as np\\n\\ndef moving_average_strategy(data, short=5, long=20):\\n    signals = pd.DataFrame(index=data.index)\\n    signals['signal'] = 0\\n\\n    signals['short_ma'] = data['close'].rolling(window=short).mean()\\n    signals['long_ma'] = data['close'].rolling(window=long).mean()\\n\\n    signals.loc[signals['short_ma'] > signals['long_ma'], 'signal'] = 1\\n    signals.loc[signals['short_ma'] < signals['long_ma'], 'signal'] = -1\\n\\n    return signals\\n\\\\\\\`\\\\\\\`\\\\\\\`\\n\\nabove代码can直ReceiveuseatStrategyBacktest.`;

    const result = markdownToPlainText(report);

    // Verify key content is preserved
    expect(result).toContain('StrategyBacktest代码');
    expect(result).toContain('Python Strategy');
    expect(result).toContain('above代码can直ReceiveuseatStrategyBacktest');

    // Verify code content is preserved
    expect(result).toContain('import pandas');
    expect(result).toContain('moving_average_strategy');
  });

  it('handles edge case: very long stock code list', () => {
    const stockList = `#  stock 池List\\n\\n## HS300Constituentshares (Partial) \\n\\n| 代码 | Name | 现价 | Change |\\n|------|------|------|--------|\\n| 600519 | Kweichow Moutai | 1680.50 | +0.85% |\\n| 000858 | 五粮液 | 125.30 | +1.20% |\\n| 600036 | CMB | 32.50 | -0.25% |\\n| 000001 | Ping An Bank | 11.85 | +0.42% |\\n| 601318 | CN平安 | 45.20 | +0.15% |\\n| 000333 | MideaGroup | 58.80 | +1.80% |\\n| 600276 | 恒瑞Pharma | 42.50 | +2.10% |\\n| 300750 | 宁DEhour代 | 185.30 | +3.20% |\\n| 688981 | SMIC | 52.80 | +4.50% |\\n| 601012 | 隆基绿can | 25.60 | -1.20% |\\n\\n## Filteritem件\\n\\n- **marketvalue**: > 500100M\\n- **PE**: 10-50\\n- **ROE**: > 15%\\n- **debt ratio**: < 60%`;

    const result = markdownToPlainText(stockList);

    // Verify all stock codes are preserved
    expect(result).toContain('600519');
    expect(result).toContain('000858');
    expect(result).toContain('601012');
    expect(result).toContain('Kweichow Moutai');
    expect(result).toContain('宁DEhour代');
    expect(result).toContain('Filteritem件');
    expect(result).toContain('ROE');
  });

  it('handles mixed Chinese and English punctuation correctly', () => {
    const text = `# ReportSummary\\n\\n**main need观点**: \\n1. short期bullish, Target price $195.00\\n2. Support位: $168.50-172.00\\n3. Resistance位: $180.50-185.00\\n\\n"Risk: Trade war impact"\\n\\n> Riskinfo: In progressUS贸易摩擦cancanImpact出口\\n\\n*Watch点*: AI chip business growth`;

    const result = markdownToPlainText(text);

    expect(result).toContain('main need观点');
    expect(result).toContain('short期bullish');
    expect(result).toContain('195.00');
    expect(result).toContain('Risk: Trade war impact');
    expect(result).toContain('Riskinfo');
    expect(result).toContain('Watch点');
    expect(result).toContain('AI chip business');
  });

  it('preserves numerical data and percentages accurately', () => {
    const report = `# DataReport\\n\\n## Keymetrics\\n\\n- revenue: 1,234.56100M\\n- net profit: +23.45%\\n- market占率: 15.67%\\n- ROE: 18.9%\\n- debt ratio: 45.2%\\n\\n## 价格range\\n\\n| Date | open | high | low | close |\\n|------|------|------|------|------|\\n| 2024-01-15 | 1680.50 | 1695.30 | 1675.20 | 1688.80 |\\n| 2024-01-16 | 1688.80 | 1702.50 | 1685.30 | 1698.20 |\\n\\nChange: +1.23% (Today)`;

    const result = markdownToPlainText(report);

    expect(result).toContain('1,234.56');
    expect(result).toContain('23.45%');
    expect(result).toContain('15.67%');
    expect(result).toContain('1680.50');
    expect(result).toContain('1695.30');
    expect(result).toContain('1.23%');
  });
});
