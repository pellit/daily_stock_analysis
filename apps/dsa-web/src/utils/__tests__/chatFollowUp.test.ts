import { describe, expect, test } from 'vitest';

import { buildChatFollowUpContext } from '../chatFollowUp';
import type { AnalysisReport } from '../../types/analysis';

describe('chat follow-up context', () => {
  test('includes market_structure_context in snake_case for history follow-up', () => {
    const report = {
      meta: {
        queryId: 'q-123',
        stockCode: '600519',
        stockName: 'Kweichow Moutai',
        reportType: 'full',
        createdAt: '2026-07-05T00:00:00Z',
      },
      summary: {
        analysisSummary: 'summary',
        operationAdvice: 'Hold',
        trendPrediction: 'neutral',
        sentimentScore: 55,
      },
      details: {
        marketStructure: {
          schemaVersion: 'market-structure-v1',
          status: 'ok',
          market: 'A-share',
          tradeDate: '2026-07-04',
          marketThemeContext: {
            schemaVersion: 'market-theme-v1',
            status: 'ok',
            market: 'A-share',
            activeThemes: [{ name: 'AI', changePct: 1.2 }],
            leadingIndustries: [{ name: 'Liquor', changePct: 0.8 }],
          },
          stockMarketPosition: {
            schemaVersion: 'stock-market-position-v1',
            status: 'ok',
            stockCode: '600519',
            stockRole: 'leader',
            themePhase: 'warming',
            primaryTheme: {
              name: 'AI',
              phase: 'warming',
            },
          },
        },
      },
    } as AnalysisReport;

    const context = buildChatFollowUpContext('600519', 'Kweichow Moutai', report);

    expect(context).toMatchObject({
      stock_code: '600519',
      stock_name: 'Kweichow Moutai',
      market_structure_context: expect.objectContaining({
        schema_version: 'market-structure-v1',
        market: 'A-share',
        trade_date: '2026-07-04',
        status: 'ok',
        market_theme_context: expect.objectContaining({
          schema_version: 'market-theme-v1',
          status: 'ok',
          market: 'A-share',
          active_themes: [{ name: 'AI', change_pct: 1.2 }],
          leading_industries: [{ name: 'Liquor', change_pct: 0.8 }],
        }),
        stock_market_position: expect.objectContaining({
          schema_version: 'stock-market-position-v1',
          status: 'ok',
          stock_code: '600519',
          stock_role: 'leader',
          theme_phase: 'warming',
          primary_theme: expect.objectContaining({
            name: 'AI',
            phase: 'warming',
          }),
        }),
      }),
    });
  });

  test('omits market_structure_context when history report has none', () => {
    const report = {
      meta: {
        queryId: 'q-456',
        stockCode: '600519',
        stockName: 'Kweichow Moutai',
        reportType: 'full',
        createdAt: '2026-07-05T00:00:00Z',
      },
      summary: {
        analysisSummary: 'summary',
        operationAdvice: 'Hold',
        trendPrediction: 'neutral',
        sentimentScore: 55,
      },
      details: {},
    } as AnalysisReport;

    const context = buildChatFollowUpContext('600519', 'Kweichow Moutai', report);

    expect(context).not.toHaveProperty('market_structure_context');
  });
});
