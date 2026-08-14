import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { historyApi } from '../../../api/history';
import type {
  AnalysisContextPackOverview,
  AnalysisReport,
  AnalysisResult,
  MarketStructureContext,
} from '../../../types/analysis';
import { AnalysisContextSummary } from '../AnalysisContextSummary';
import { ReportSummary } from '../ReportSummary';

vi.mock('../../../api/history', () => ({
  historyApi: {
    getDiagnostics: vi.fn(),
    getNews: vi.fn(),
  },
}));

const overview: AnalysisContextPackOverview = {
  packVersion: '1.0',
  createdAt: '2026-04-10T08:30:00+00:00',
  subject: {
    code: '600519',
    stockName: 'Kweichow Moutai',
    market: 'cn',
  },
  blocks: [
    {
      key: 'quote',
      label: 'Quote',
      status: 'available',
      source: 'mock_quote',
      warnings: [],
      missingReasons: [],
    },
    {
      key: 'news',
      label: '新闻',
      status: 'missing',
      source: null,
      warnings: ['news_provider_timeout'],
      missingReasons: ['news_context_missing'],
    },
    {
      key: 'fundamentals',
      label: '基本面',
      status: 'fetch_failed',
      source: 'fundamental_pipeline',
      warnings: [],
      missingReasons: ['fundamental_pipeline_failed'],
    },
  ],
  counts: {
    available: 1,
    missing: 1,
    notSupported: 0,
    fallback: 0,
    stale: 0,
    estimated: 0,
    partial: 0,
    fetchFailed: 1,
  },
  dataQuality: {
    overallScore: 82,
    level: 'usable',
    blockScores: {
      quote: 100,
      daily_bars: 100,
      technical: 100,
      news: 35,
      fundamentals: 25,
      chip: 100,
    },
    limitations: ['fundamentals: fetch_failed'],
  },
  warnings: ['intraday_realtime_overlay'],
  metadata: {
    triggerSource: 'api',
    newsResultCount: 3,
  },
};

const marketStructure: MarketStructureContext = {
  schemaVersion: 'market-structure-v1',
  status: 'ok',
  market: 'cn',
  tradeDate: '2026-07-12',
  marketThemeContext: {
    schemaVersion: 'market-theme-v1',
    status: 'ok',
    market: 'cn',
    activeThemes: [{ name: 'Robotics', rank: 1, source: 'concept' }],
    leadingConcepts: [],
    leadingIndustries: [],
    laggingThemes: [],
    themeBreadth: {
      activeCount: 1,
      leadingConceptCount: 0,
      leadingIndustryCount: 0,
      laggingCount: 0,
    },
    dataQuality: { status: 'ok', missingFields: [], sources: [], errors: [] },
  },
  stockMarketPosition: {
    schemaVersion: 'stock-market-position-v1',
    status: 'ok',
    stockCode: '600519',
    stockName: 'Kweichow Moutai',
    market: 'cn',
    primaryTheme: { name: 'Robotics', source: 'concept', rank: 1 },
    relatedBoards: [],
    stockRole: 'follower',
    themePhase: 'accelerating',
    riskTags: [],
    missingFields: [],
  },
};

describe('AnalysisContextSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a collapsed summary and expands overview details on demand', () => {
    render(<AnalysisContextSummary overview={overview} />);

    const panel = screen.getByTestId('analysis-context-summary');
    expect(panel).not.toHaveAttribute('open');
    expect(within(panel).getAllByText('InputData块')[0]).toBeVisible();
    expect(screen.getAllByText('Available 1')[0]).toBeVisible();
    expect(screen.getAllByText('Missing 1')[0]).toBeVisible();
    expect(screen.getAllByText('抓取Failure 1')[0]).toBeVisible();
    expect(screen.getAllByText('质量分 82/100 Available')[0]).toBeVisible();
    expect(screen.getByText('触发Source: api')).toBeVisible();
    expect(screen.getByText('Source: mock_quote')).not.toBeVisible();

    fireEvent.click(within(panel).getAllByText('InputData块')[0]);

    expect(panel).toHaveAttribute('open');
    expect(screen.getByText('Quote')).toBeInTheDocument();
    expect(screen.getByText('Source: mock_quote')).toBeVisible();
    expect(screen.getByText('Alert:')).toBeInTheDocument();
    expect(screen.getByText(/intraday_realtime_overlay/)).toBeInTheDocument();
    expect(screen.getByText('Data限制:')).toBeInTheDocument();
    expect(screen.getByText(/基本面：抓取Failure/)).toBeInTheDocument();
    expect(screen.getByText(/news_provider_timeout/)).toBeInTheDocument();
    expect(screen.getByText(/说明: 新闻未进入本次 LLM Analyze，结论未使用新闻上下文/)).toBeInTheDocument();
    expect(screen.getByText(/Diagnostics码: news_context_missing/)).toBeInTheDocument();
    expect(screen.getByText(/Report页相关资讯由独立接口补充，Show与No不代表已进入本次Analyze/)).toBeInTheDocument();
    expect(screen.getByText('Source: Not recordedInputSource')).toBeInTheDocument();
    expect(screen.queryByText(/^处理:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Scope:/)).not.toBeInTheDocument();
    const fundamentalsBlock = screen.getByText('基本面').closest('.home-subpanel');
    expect(fundamentalsBlock).not.toBeNull();
    const fundamentals = within(fundamentalsBlock as HTMLElement);
    expect(fundamentals.getByText(/说明: 基本面抓取Failure，本次Analyze未使用基本面Data/)).toBeInTheDocument();
    expect(fundamentals.getByText(/Diagnostics码: fundamental_pipeline_failed/)).toBeInTheDocument();
    expect(screen.getAllByText('新闻Result数: 3').some((item) => item.textContent === '新闻Result数: 3')).toBe(true);
    expect(screen.getAllByText('本次AnalyzeInput')[0]).toBeVisible();
  });

  it('localizes the collapsed summary for english reports', () => {
    render(<AnalysisContextSummary overview={overview} language="en" />);

    const panel = screen.getByTestId('analysis-context-summary');
    expect(panel).not.toHaveAttribute('open');
    expect(screen.getAllByText('Input Blocks')[0]).toBeVisible();
    expect(screen.getByText('Shows inputs included in this LLM run, not provider run success')).toBeVisible();
    expect(screen.getAllByText('Available 1')[0]).toBeVisible();
    expect(screen.getAllByText('Missing 1')[0]).toBeVisible();
    expect(screen.getAllByText('Fetch failed 1')[0]).toBeVisible();
    expect(screen.getAllByText('Quality 82/100 Usable')[0]).toBeVisible();
    expect(screen.getByText('Trigger: api')).toBeVisible();

    fireEvent.click(within(panel).getAllByText('Input Blocks')[0]);

    expect(screen.getByText('Data Limitations:')).toBeInTheDocument();
    expect(screen.getByText(/fundamentals: Fetch failed/)).toBeInTheDocument();
    expect(screen.getByText(/Details: News was not included in this LLM run, so the conclusion did not use news context/)).toBeInTheDocument();
    expect(screen.getByText(/related news on the report page is loaded separately and does not indicate that it was used in this analysis/)).toBeInTheDocument();
    expect(screen.getByText(/Diagnostic code: news_context_missing/)).toBeInTheDocument();
    expect(screen.queryByText(/^Action:/)).not.toBeInTheDocument();
  });

  it('does not claim available fundamentals were unused when only provenance is missing', () => {
    const availableFundamentalsOverview: AnalysisContextPackOverview = {
      ...overview,
      blocks: [{
        key: 'fundamentals',
        label: '基本面',
        status: 'available',
        source: null,
        warnings: [],
        missingReasons: ['fundamental_source_chain_missing'],
      }],
      counts: {
        available: 1,
        missing: 0,
        notSupported: 0,
        fallback: 0,
        stale: 0,
        estimated: 0,
        partial: 0,
        fetchFailed: 0,
      },
    };

    render(<AnalysisContextSummary overview={availableFundamentalsOverview} />);

    fireEvent.click(screen.getAllByText('InputData块')[0]);

    expect(screen.getByText(/说明: Not recorded基本面Source链Metadata/)).toBeInTheDocument();
    expect(screen.getByText(/基本面Whether进入本次Analyze以Current status为准/)).toBeInTheDocument();
    expect(screen.getByText(/Diagnostics码: fundamental_source_chain_missing/)).toBeInTheDocument();
    expect(screen.queryByText(/本次Analyze未使用基本面Data/)).not.toBeInTheDocument();
  });

  it('uses status guidance for unknown reason codes without adding another field', () => {
    const unknownReasonOverview: AnalysisContextPackOverview = {
      ...overview,
      blocks: [{
        key: 'fundamentals',
        label: '基本面',
        status: 'fetch_failed',
        source: 'fundamental_pipeline',
        warnings: [],
        missingReasons: ['brand_new_internal_code'],
      }],
      counts: {
        available: 0,
        missing: 0,
        notSupported: 0,
        fallback: 0,
        stale: 0,
        estimated: 0,
        partial: 0,
        fetchFailed: 1,
      },
    };

    render(<AnalysisContextSummary overview={unknownReasonOverview} />);

    fireEvent.click(screen.getAllByText('InputData块')[0]);

    expect(screen.getByText(/说明: Data抓取Failure，本次Analyze未使用该Data；请CheckSource、Network或限流后Reanalyze/)).toBeInTheDocument();
    expect(screen.getByText(/Diagnostics码: brand_new_internal_code/)).toBeInTheDocument();
    expect(screen.queryByText(/^处理:/)).not.toBeInTheDocument();
  });

  it('explains the real chip_not_supported reason with actionable guidance', () => {
    const unsupportedChipOverview: AnalysisContextPackOverview = {
      ...overview,
      blocks: [{
        key: 'chip',
        label: 'Chip',
        status: 'not_supported',
        source: null,
        warnings: [],
        missingReasons: ['chip_not_supported'],
      }],
      counts: {
        available: 0,
        missing: 0,
        notSupported: 1,
        fallback: 0,
        stale: 0,
        estimated: 0,
        partial: 0,
        fetchFailed: 0,
      },
    };

    render(<AnalysisContextSummary overview={unsupportedChipOverview} />);

    fireEvent.click(screen.getAllByText('InputData块')[0]);

    expect(screen.getByText(/说明: 当前Market或Symbol不支持ChipData，本次Analyze未使用该指标；请结合其他指标判断/)).toBeInTheDocument();
    expect(screen.getByText(/Diagnostics码: chip_not_supported/)).toBeInTheDocument();
    expect(screen.queryByText(/^处理:/)).not.toBeInTheDocument();
  });

  it('surfaces degraded non-zero states in the collapsed summary', () => {
    const degradedOverview: AnalysisContextPackOverview = {
      ...overview,
      blocks: [
        {
          key: 'quote',
          label: 'Quote',
          status: 'fallback',
          source: 'cached_quote',
          warnings: ['quote_fallback'],
          missingReasons: [],
        },
        {
          key: 'fundamental',
          label: '基本面',
          status: 'stale',
          source: 'fundamental_cache',
          warnings: ['stale_fundamental'],
          missingReasons: [],
        },
        {
          key: 'technical',
          label: '技术',
          status: 'partial',
          source: 'technical_pipeline',
          warnings: ['technical_partial'],
          missingReasons: [],
        },
        {
          key: 'chip',
          label: 'Chip',
          status: 'estimated',
          source: 'estimated_chip',
          warnings: [],
          missingReasons: [],
        },
        {
          key: 'daily_bars',
          label: 'Daily',
          status: 'not_supported',
          source: null,
          warnings: [],
          missingReasons: [],
        },
      ],
      counts: {
        available: 0,
        missing: 0,
        notSupported: 1,
        fallback: 1,
        stale: 1,
        estimated: 1,
        partial: 1,
        fetchFailed: 0,
      },
    };

    render(<AnalysisContextSummary overview={degradedOverview} />);

    const panel = screen.getByTestId('analysis-context-summary');
    expect(panel).not.toHaveAttribute('open');
    expect(within(panel).getByText('Available 0')).toBeVisible();
    expect(within(panel).getByText('Missing 0')).toBeVisible();
    expect(within(panel).getAllByText('Fallback 1')[0]).toBeVisible();
    expect(within(panel).getAllByText('Expired 1')[0]).toBeVisible();
    expect(within(panel).getAllByText('估算 1')[0]).toBeVisible();
    expect(within(panel).getAllByText('PartialAvailable 1')[0]).toBeVisible();
    expect(within(panel).getAllByText('不支持 1')[0]).toBeVisible();

    fireEvent.click(within(panel).getAllByText('InputData块')[0]);

    const quoteBlock = screen.getByText('Quote').closest('.home-subpanel');
    expect(quoteBlock).not.toBeNull();
    expect(within(quoteBlock as HTMLElement).getByText('说明: 本次Analyze使用了备用Data路径；请结合Source和Alert复核Result')).toBeInTheDocument();
    expect(within(quoteBlock as HTMLElement).queryByText(/^处理:/)).not.toBeInTheDocument();

    expect(screen.getByText('说明: 本次Analyze使用的不YesLatestData；请CheckUpdated at并按需Reanalyze')).toBeInTheDocument();
    expect(screen.getByText('Note: only partial data was used in this analysis; conclusions may be incomplete. Review alerts and data sources, then re-run the analysis.')).toBeInTheDocument();
    expect(screen.getByText('说明: 本次Analyze使用了估算Data；请结合原始Data复核Result')).toBeInTheDocument();
    expect(screen.getByText('Note: the current market or symbol does not support this data; it was not used in this analysis. Combine with other indicators.')).toBeInTheDocument();
  });

  it('does not render without an overview', () => {
    const { container } = render(<AnalysisContextSummary overview={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render raw values or unexpected sensitive fields', () => {
    const unsafeOverview = {
      ...overview,
      value: 'raw trend payload',
      content: 'Complete新闻Body不应出现',
      apiKey: 'secret-key',
      blocks: [
        {
          ...overview.blocks[0],
          items: {
            price: {
              value: 1880,
              apiKey: 'secret-key',
            },
          },
        },
      ],
    } as unknown as AnalysisContextPackOverview;

    render(<AnalysisContextSummary overview={unsafeOverview} />);

    fireEvent.click(screen.getAllByText('InputData块')[0]);

    expect(screen.queryByText('raw trend payload')).not.toBeInTheDocument();
    expect(screen.queryByText('Complete新闻Body不应出现')).not.toBeInTheDocument();
    expect(screen.queryByText('secret-key')).not.toBeInTheDocument();
  });
});

describe('ReportSummary analysis context placement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders strategy and news before context, diagnostics and traceability', async () => {
    vi.mocked(historyApi.getNews).mockResolvedValue({
      total: 0,
      items: [],
    });

    const report: AnalysisReport = {
      meta: {
        id: 1,
        queryId: 'q1',
        stockCode: '600519',
        stockName: 'Kweichow Moutai',
        reportType: 'detailed',
        reportLanguage: 'zh',
        createdAt: '2026-04-10T12:00:00',
        marketPhaseSummary: {
          market: 'cn',
          phase: 'intraday',
          marketLocalTime: '2026-04-10T10:30:00+08:00',
          sessionDate: '2026-04-10',
          effectiveDailyBarDate: '2026-04-09',
          isTradingDay: true,
          isMarketOpenNow: true,
          isPartialBar: true,
          minutesToOpen: null,
          minutesToClose: 150,
          triggerSource: 'api',
          analysisIntent: 'auto',
          warnings: [],
        },
      },
      summary: {
        analysisSummary: 'summary',
        operationAdvice: 'Hold',
        trendPrediction: 'Range',
        sentimentScore: 70,
      },
      strategy: {
        idealBuy: '120',
      },
      details: {
        analysisContextPackOverview: overview,
        marketStructure,
      },
    };
    const result: AnalysisResult = {
      queryId: 'q1',
      stockCode: '600519',
      stockName: 'Kweichow Moutai',
      report,
      diagnosticSummary: {
        status: 'normal',
        statusLabel: '正常',
        reason: '运行正常',
        components: {},
        copyText: '',
      },
      createdAt: '2026-04-10T12:00:00',
    };

    render(<ReportSummary data={result} />);

    await waitFor(() => {
      expect(screen.getByText('暂无相关资讯')).toBeInTheDocument();
    });

    expect(screen.getByText('MarketPhase: CN · Intraday')).toBeInTheDocument();
    expect(screen.getByText('Daily未Complete')).toBeInTheDocument();
    expect(screen.getAllByText('质量分 82/100 Available')[0]).toBeInTheDocument();

    const strategy = screen.getByText('狙击点位');
    const news = screen.getByText('相关资讯');
    const diagnostics = screen.getByTestId('run-diagnostics');
    const contextSummary = screen.getByTestId('analysis-context-summary');
    expect(contextSummary).not.toHaveAttribute('open');
    expect(diagnostics).not.toHaveAttribute('open');
    const traceability = screen.getByText('Data追溯');

    expect(strategy.compareDocumentPosition(news) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(news.compareDocumentPosition(contextSummary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(contextSummary.compareDocumentPosition(diagnostics) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(diagnostics.compareDocumentPosition(traceability) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(within(contextSummary).getAllByText('InputData块')[0]);
    expect(within(contextSummary).getByText(/说明: 新闻未进入本次 LLM Analyze，结论未使用新闻上下文/)).toBeInTheDocument();
    expect(within(contextSummary).getByText(/Report页相关资讯由独立接口补充，Show与No不代表已进入本次Analyze/)).toBeInTheDocument();
    expect(screen.queryByText('AI 建议 / 决策信号')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '题材主线与个shares位置' })).not.toBeInTheDocument();
    expect(screen.queryByText('Robotics')).not.toBeInTheDocument();
  });
});
