import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScreeningHotspotDetail } from '../../api/screening';
import StockScreeningPage from '../StockScreeningPage';

const {
  enableScreening,
  getScreeningStatus,
  getHotspotDetail,
  getHotspots,
  getStrategies,
  getScreenTask,
  navigate,
  resetLastScreenResult,
  screenStocks,
  startScreenTask,
} = vi.hoisted(() => {
  let lastScreenResult: unknown = null;
  const screenStocks = vi.fn();
  const startScreenTask = vi.fn(async (payload: unknown) => {
    lastScreenResult = await screenStocks(payload);
    return {
      taskId: 'screen-task-1',
      traceId: 'screen-task-1',
      status: 'pending',
      message: 'Screening Screening任务已Submit',
      strategy: 'dual_low',
      market: 'cn',
      maxResults: 3,
    };
  });
  const getScreenTask = vi.fn(async (taskId: string) => {
    void taskId;
    return {
      taskId: 'screen-task-1',
      traceId: 'screen-task-1',
      status: 'completed',
      progress: 100,
      message: '任务执行Complete',
      result: lastScreenResult,
    };
  });
  return {
    enableScreening: vi.fn(),
    getScreeningStatus: vi.fn(),
    getHotspotDetail: vi.fn(),
    getHotspots: vi.fn(),
    getStrategies: vi.fn(),
    getScreenTask,
    navigate: vi.fn(),
    resetLastScreenResult: () => {
      lastScreenResult = null;
    },
    screenStocks,
    startScreenTask,
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('../../api/screening', () => ({
  screeningApi: {
    enable: () => enableScreening(),
    getStatus: () => getScreeningStatus(),
    getHotspotDetail: (payload: unknown) => getHotspotDetail(payload),
    getHotspots: (payload: unknown) => getHotspots(payload),
    getStrategies: () => getStrategies(),
    getScreenTask: (taskId: string) => getScreenTask(taskId),
    screen: (payload: unknown) => screenStocks(payload),
    startScreen: (payload: unknown) => startScreenTask(payload),
  },
}));

const mockStrategiesResponse = {
  enabled: true,
  strategies: [
    {
      id: 'dual_low',
      name: 'Dual Low',
      title: 'Dual Low',
      description: 'Low valuation strategy',
      category: 'value',
      tag: 'value',
      tags: ['value'],
      marketScope: ['cn'],
    },
  ],
  strategyCount: 1,
};

function createDeferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('StockScreeningPage', () => {
  beforeEach(() => {
    enableScreening.mockReset();
    getScreeningStatus.mockReset();
    getHotspotDetail.mockReset();
    getHotspots.mockReset();
    getStrategies.mockReset();
    getScreenTask.mockClear();
    navigate.mockReset();
    resetLastScreenResult();
    screenStocks.mockReset();
    startScreenTask.mockClear();
    getStrategies.mockResolvedValue(mockStrategiesResponse);
    getHotspotDetail.mockResolvedValue({
      enabled: true,
      provider: 'akshare',
      topic: 'AI computing',
      name: 'AI computing',
      canonicalTopic: 'Compute',
      summary: 'AICompute Intraday发酵。',
      qualityStatus: 'stale',
      missingFields: ['live_stocks'],
      fallbackUsed: true,
      stale: true,
      staleAgeHours: 2.5,
      sourceErrors: ['akshare timeout'],
      route: [{ title: 'Intraday发酵', description: '出现大笔Buy。', source: 'eastmoney_board_change' }],
      stocks: [{
        code: '300000',
        name: 'Innolight',
        role: '核心龙头',
        hotStockScore: 88,
        source: 'last_good_cache.leader_stocks',
        sourceConfidence: 0.65,
        fallbackUsed: true,
      }],
      stockCount: 1,
    });
    getHotspots.mockResolvedValue({ enabled: true, provider: 'akshare', hotspots: [], hotspotCount: 0 });
    window.sessionStorage.clear();
  });

  it('keeps implementation attribution and repeated guidance off the operation page', async () => {
    getScreeningStatus.mockResolvedValueOnce({ enabled: true, available: true });

    render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();
    expect(screen.queryByText(/AlphaSift/)).not.toBeInTheDocument();
    expect(screen.queryByText(/theme_heat/)).not.toBeInTheDocument();
    expect(screen.queryByText('Experimental与Riskinfo')).not.toBeInTheDocument();
    expect(screen.queryByText('ScreeningResult')).not.toBeInTheDocument();
  });

  it('re-syncs enabled state when Screening availability check fails after config is enabled', async () => {
    getScreeningStatus
      .mockResolvedValueOnce({
        enabled: false,
        available: false,
      })
      .mockResolvedValueOnce({
        enabled: true,
        available: false,
      });
    enableScreening.mockRejectedValueOnce(new Error('Screening功能不Available，请Check后端Log'));

    render(<StockScreeningPage />);

    expect((await screen.findAllByText('Screening disabled')).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /运行Screening/ })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Enable screening' }));

    await waitFor(() => expect(getScreeningStatus).toHaveBeenCalledTimes(2));
    expect(screen.getAllByText('Screening disabled').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /运行Screening/ })).toBeDisabled();
    expect(screen.getByText('Screening功能不Available')).toBeInTheDocument();
    expect(screen.getByText('Screening功能不Available，请Check后端Log')).toBeInTheDocument();
  });

  it('loads Screening hotspot themes on demand', async () => {
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    getHotspots
      .mockResolvedValueOnce({
        enabled: true,
        provider: 'akshare',
        providerUsed: 'akshare',
        hotspots: [],
        hotspotCount: 0,
        cacheUsed: true,
        cachedAt: '2026-06-07T08:00:00Z',
      })
      .mockResolvedValueOnce({
        enabled: true,
        provider: 'akshare',
        providerUsed: 'akshare',
        hotspots: [
          {
            topic: 'AI computing',
            name: 'AI computing',
            heatScore: 88,
            trendScore: 12,
            persistenceScore: 66,
            changePct: 4.2,
            stage: 'Accelerating主升',
            sampleStockCount: 8,
            leaders: ['Innolight', 'Foxconn Industrial Internet'],
          },
        ],
        hotspotCount: 1,
      });

    render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();
    await waitFor(() => expect(getHotspots).toHaveBeenCalledWith({ provider: 'akshare', top: 12, refresh: false }));
    expect(getHotspotDetail).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Expand热点题材/ }));
    fireEvent.click(screen.getByRole('button', { name: /Refresh热点题材/ }));

    await waitFor(() => expect(getHotspots).toHaveBeenCalledWith({ provider: 'akshare', top: 12, refresh: true }));
    fireEvent.click(await screen.findByRole('button', { name: /AI computing/ }));
    await waitFor(() => expect(getHotspotDetail).toHaveBeenCalledWith({ topic: 'AI computing', provider: 'akshare', refresh: false }));
    await waitFor(() => expect(screen.getAllByText('AI computing').length).toBeGreaterThan(0));
    expect(screen.getByText('强势领先')).toBeInTheDocument();
    expect(screen.getAllByText(/Innolight、Foxconn Industrial Internet/).length).toBeGreaterThan(0);
    expect(screen.getByText(/覆盖 8 shares/)).toBeInTheDocument();
    expect(await screen.findByText('发酵Time线')).toBeInTheDocument();
    expect(screen.getByText('标准题材：Compute')).toBeInTheDocument();
    expect(screen.getByText('质量 Cache')).toBeInTheDocument();
    expect(screen.getByText('Cache回退 2.5h')).toBeInTheDocument();
    expect(screen.getByText('DetailData已Fallback，Expand查看Reason')).toBeInTheDocument();
    expect(screen.getByText(/暂缺：实时ThemesharesQuote/)).toBeInTheDocument();
    expect(screen.getByText('热点明细RequestTimeout')).toBeInTheDocument();
    expect(screen.getByText('Intraday发酵')).toBeInTheDocument();
    expect(screen.getByText('Themeshares')).toBeInTheDocument();
    expect(screen.getByText('Innolight')).toBeInTheDocument();
    expect(screen.queryByText(/last_good_cache|置信 65%/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Analyze Innolight' }));
    expect(navigate).toHaveBeenCalledWith('/', {
      state: {
        stockCode: '300000',
        stockName: 'Innolight',
        autoAnalyze: true,
        selectionSource: 'screening_hotspot',
        skills: ['hot_theme'],
      },
    });
  });

  it('searches recent hotspot news only when requested and links the result', async () => {
    getScreeningStatus.mockResolvedValueOnce({ enabled: true, available: true });
    getHotspots.mockResolvedValueOnce({
      enabled: true,
      provider: 'akshare',
      hotspots: [{ topic: 'AI computing', name: 'AI computing', heatScore: 88 }],
      hotspotCount: 1,
    });
    getHotspotDetail
      .mockResolvedValueOnce({
        enabled: true,
        provider: 'akshare',
        topic: 'AI computing',
        route: [{ title: 'Intraday发酵', description: 'Themeshares活跃。' }],
        stocks: [],
        stockCount: 0,
      })
      .mockResolvedValueOnce({
        enabled: true,
        provider: 'akshare',
        topic: 'AI computing',
        newsSearchRequested: true,
        newsSearchStatus: 'available',
        route: [{
          title: 'ComputeSupply chain出现新Catalyst',
          description: '近期订单与政策预期升温。',
          url: 'https://example.com/ai-news',
          searchResult: true,
        }],
        stocks: [],
        stockCount: 0,
      });

    render(<StockScreeningPage />);

    await screen.findByText('Screening enabled');
    fireEvent.click(screen.getByRole('button', { name: /Expand热点题材/ }));
    fireEvent.click(await screen.findByRole('button', { name: /AI computing/ }));
    await waitFor(() => expect(getHotspotDetail).toHaveBeenCalledTimes(1));

    fireEvent.click(await screen.findByRole('button', { name: 'SearchLatest消息' }));

    await waitFor(() => expect(getHotspotDetail).toHaveBeenLastCalledWith({
      topic: 'AI computing',
      provider: 'akshare',
      refresh: false,
      includeSearch: true,
    }));
    const link = await screen.findByRole('link', { name: '查看消息' });
    expect(link).toHaveAttribute('href', 'https://example.com/ai-news');

    getHotspotDetail.mockResolvedValueOnce({
      enabled: true,
      provider: 'akshare',
      topic: 'AI computing',
      newsSearchRequested: true,
      newsSearchStatus: 'unavailable',
      route: [{ title: 'Intraday发酵', description: 'Themeshares活跃。' }],
      stocks: [],
      stockCount: 0,
    });
    fireEvent.click(screen.getByRole('button', { name: 'SearchLatest消息' }));

    expect(await screen.findByText('消息SearchFailure，请稍后Retry。')).toBeInTheDocument();
    expect(screen.getByText('Intraday发酵')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '查看消息' })).not.toBeInTheDocument();

    getHotspotDetail.mockResolvedValueOnce({
      enabled: true,
      provider: 'akshare',
      topic: 'AI computing',
      newsSearchRequested: true,
      newsSearchStatus: 'no_results',
      route: [{ title: 'Intraday发酵', description: 'Themeshares活跃。' }],
      stocks: [],
      stockCount: 0,
    });
    fireEvent.click(screen.getByRole('button', { name: 'SearchLatest消息' }));

    expect(await screen.findByText('暂未搜到该题材近期的Valid消息。')).toBeInTheDocument();
    expect(screen.queryByText('消息SearchFailure，请稍后Retry。')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Collapse热点题材/ }));
    fireEvent.click(screen.getByRole('button', { name: /Expand热点题材/ }));
    fireEvent.click(await screen.findByRole('button', { name: /AI computing/ }));

    await waitFor(() => expect(screen.queryByRole('link', { name: '查看消息' })).not.toBeInTheDocument());
    expect(screen.getByText('Intraday发酵')).toBeInTheDocument();
    expect(getHotspotDetail).toHaveBeenCalledTimes(4);
  });

  it('renders hotspot details as user-facing Chinese without provider internals', async () => {
    getScreeningStatus.mockResolvedValueOnce({ enabled: true, available: true });
    getHotspots.mockResolvedValueOnce({
      enabled: true,
      provider: 'akshare',
      providerUsed: 'DsaEastMoneyHotspotProvider',
      hotspots: [{
        topic: 'Text media',
        name: 'Text media',
        heatScore: 100,
        stage: '初次异动',
        leaders: ['China Online'],
      }],
      hotspotCount: 1,
    });
    getHotspotDetail.mockResolvedValueOnce({
      enabled: true,
      provider: 'akshare',
      topic: 'Text media',
      name: 'Text media',
      summary: 'Text media current hot detail, heat 100.0, stage first shock, leader stock China Online, quality status available.',
      qualityStatus: 'available',
      fallbackUsed: true,
      cacheUsed: false,
      stale: false,
      sourceErrors: [
        'DsaEastMoneyHotspotProvider.stock_board_concept_cons_em: hotspot source DsaEastMoneyHotspotProvider.stock_board_concept_cons_em timed out after 20s',
      ],
      route: [{
        date: '2026-08-01',
        title: 'Current fermentation',
        description: 'Text media heat 100.0; stage first shock; leaders China Online',
        source: 'DsaEastMoneyHotspotProvider',
      }],
      stocks: [{
        code: '300364',
        name: 'China Online',
        role: 'laggard',
        hotStockScore: 35,
        source: 'DsaEastMoneyHotspotProvider.concept_constituents',
        sourceConfidence: 1,
      }],
      stockCount: 1,
    });

    render(<StockScreeningPage />);

    expect(await screen.findByRole('heading', { name: 'Screening' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Expand热点题材/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Text media/ }));

    expect(await screen.findByText('Text media：热度 100.0，Phase 初次异动，核心shares China Online。')).toBeInTheDocument();
    expect(screen.getByText('质量 Available')).toBeInTheDocument();
    expect(screen.getByText('备用Source')).toBeInTheDocument();
    expect(screen.queryByText(/^Cache回退/)).not.toBeInTheDocument();
    expect(screen.getByText('当前发酵')).toBeInTheDocument();
    expect(screen.getByText('Text media热度 100.0，Phase 初次异动，核心shares China Online。')).toBeInTheDocument();
    expect(screen.queryByText('DetailData已Fallback，Expand查看Reason')).not.toBeInTheDocument();
    expect(screen.queryByText('热点明细RequestTimeout（20 秒）')).not.toBeInTheDocument();
    expect(screen.getByText('Falling behind')).toBeInTheDocument();
    expect(screen.getByText(/暂无Quote/)).toBeInTheDocument();
    expect(screen.queryByText(/Current fermentation|quality status|available|DsaEastMoneyHotspotProvider|concept_constituents/)).not.toBeInTheDocument();
  });

  it('shows cached hotspot preview while full details are still loading', async () => {
    const detailRequest = createDeferred<ScreeningHotspotDetail>();
    getScreeningStatus.mockResolvedValueOnce({ enabled: true, available: true });
    getHotspots.mockResolvedValueOnce({
      enabled: true,
      provider: 'akshare',
      hotspots: [{
        topic: 'Robotics',
        name: 'Robotics',
        heatScore: 92,
        stage: 'Accelerating主升',
        leaders: ['Topstar'],
        leaderStocks: [{ code: '300607', name: 'Topstar', role: '核心龙头', hotStockScore: 86 }],
        sampleStockCount: 1,
        qualityStatus: 'available',
      }],
      hotspotCount: 1,
    });
    getHotspotDetail.mockReturnValueOnce(detailRequest.promise);

    render(<StockScreeningPage />);

    await waitFor(() => expect(getHotspots).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: /Expand热点题材/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Robotics/ }));

    expect(await screen.findByText('Robotics：热度 92.0，Phase Accelerating主升，核心shares Topstar。')).toBeInTheDocument();
    expect(screen.getByText('正在补充Detail')).toBeInTheDocument();
    expect(screen.getAllByText('Topstar').length).toBeGreaterThan(0);

    act(() => {
      detailRequest.resolve({
        enabled: true,
        provider: 'akshare',
        topic: 'Robotics',
        name: 'Robotics',
        summary: 'RoboticsDetail已Update。',
        route: [{ title: 'Intraday发酵', description: 'Themeshares活跃度提升。' }],
        stocks: [{ code: '300607', name: 'Topstar', role: '核心龙头', hotStockScore: 86 }],
        stockCount: 1,
      });
    });
    await waitFor(() => expect(screen.queryByText('正在补充Detail')).not.toBeInTheDocument());
    expect(screen.getByText('Intraday发酵')).toBeInTheDocument();
  });

  it('localizes backend hotspot no-cache hint on initial load', async () => {
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    getHotspots.mockResolvedValueOnce({
      enabled: true,
      provider: 'akshare',
      providerUsed: 'akshare',
      hotspots: [],
      hotspotCount: 0,
      message: 'No cached Screening hotspot snapshot. Click refresh to fetch live hotspots.',
    });

    render(<StockScreeningPage />);

    await waitFor(() => expect(getHotspots).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('暂无热点Cache')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Expand热点题材/ }));
    expect(await screen.findByText('暂无热点Cache')).toBeInTheDocument();
    expect(screen.queryByText(/No cached Screening hotspot snapshot/)).not.toBeInTheDocument();
  });

  it('shows backend hotspot empty message before raw source diagnostics', async () => {
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    getHotspots.mockResolvedValueOnce({
      enabled: true,
      provider: 'akshare',
      providerUsed: 'DsaEastMoneyHotspotProvider',
      hotspots: [],
      hotspotCount: 0,
      sourceErrors: ['eastmoney_hotspot_unavailable', "RemoteDisconnected('Remote end closed connection without response')"],
      message: '热点源Connect中断，暂无AvailableCache。',
    });

    render(<StockScreeningPage />);

    await waitFor(() => expect(getHotspots).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: /Expand热点题材/ }));
    expect(await screen.findByText('热点源Connect中断，暂无AvailableCache。')).toBeInTheDocument();
    expect(screen.queryByText(/RemoteDisconnected/)).not.toBeInTheDocument();
  });

  it('prefers merged hotspot route summaries over raw timeline items', async () => {
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    getHotspots.mockResolvedValueOnce({
      enabled: true,
      provider: 'akshare',
      providerUsed: 'akshare',
      hotspots: [{ topic: 'AI computing', name: 'AI computing', heatScore: 88, stage: 'Accelerating主升' }],
      hotspotCount: 1,
    });
    getHotspotDetail.mockResolvedValueOnce({
      enabled: true,
      provider: 'akshare',
      topic: 'AI computing',
      name: 'AI computing',
      summary: 'AICompute 当前热点Detail。',
      route: [{ title: 'route-summary', description: 'compact route summary', source: 'news_search' }],
      timeline: [{ title: 'raw-timeline', description: 'full raw timeline text should stay hidden', source: 'raw_news' }],
      stocks: [],
      stockCount: 0,
    });

    render(<StockScreeningPage />);

    await waitFor(() => expect(getHotspots).toHaveBeenCalledWith({ provider: 'akshare', top: 12, refresh: false }));
    fireEvent.click(screen.getByRole('button', { name: /Expand热点题材/ }));
    fireEvent.click(await screen.findByRole('button', { name: /AI computing/ }));

    expect(await screen.findByText('route-summary')).toBeInTheDocument();
    expect(screen.getByText('compact route summary')).toBeInTheDocument();
    expect(screen.queryByText('raw-timeline')).not.toBeInTheDocument();
    expect(screen.queryByText('full raw timeline text should stay hidden')).not.toBeInTheDocument();
  });

  it('uses prefetched hotspot details from the hotspot list response', async () => {
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    getHotspots.mockResolvedValueOnce({
      enabled: true,
      provider: 'akshare',
      providerUsed: 'akshare',
      hotspots: [{ topic: 'Moly', name: 'Moly', heatScore: 96, stage: 'warming' }],
      hotspotCount: 1,
      details: {
        Moly: {
          enabled: true,
          provider: 'akshare',
          topic: 'Moly',
          name: 'Moly',
          summary: 'Moly event summary',
          route: [{ title: 'prefetched catalyst', description: 'substitution drove the theme', source: 'news_search' }],
          stocks: [{ code: '603799', name: 'Moly Leader', role: 'leader', hotStockScore: 90 }],
          stockCount: 1,
        },
      },
    });

    render(<StockScreeningPage />);

    await waitFor(() => expect(getHotspots).toHaveBeenCalledWith({ provider: 'akshare', top: 12, refresh: false }));
    fireEvent.click(screen.getByRole('button', { name: /Expand热点题材/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Moly/ }));

    expect(await screen.findByText('prefetched catalyst')).toBeInTheDocument();
    expect(screen.getByText('substitution drove the theme')).toBeInTheDocument();
    expect(screen.getByText('Moly Leader')).toBeInTheDocument();
    expect(getHotspotDetail).not.toHaveBeenCalled();
  });

  it('loads selected hotspot detail once when switching themes', async () => {
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    getHotspots.mockResolvedValueOnce({
      enabled: true,
      provider: 'akshare',
      providerUsed: 'akshare',
      hotspots: [
        {
          topic: 'AI computing',
          name: 'AI computing',
          heatScore: 88,
          stage: 'Accelerating主升',
        },
        {
          topic: 'Robotics actuator',
          name: 'Robotics actuator',
          heatScore: 80,
          stage: '轮动扩散',
        },
      ],
      hotspotCount: 2,
    });

    render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();
    await waitFor(() => expect(getHotspots).toHaveBeenCalledWith({ provider: 'akshare', top: 12, refresh: false }));
    expect(getHotspotDetail).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Expand热点题材/ }));
    fireEvent.click(screen.getByRole('button', { name: /AI computing/ }));
    await waitFor(() => expect(getHotspotDetail).toHaveBeenCalledWith({ topic: 'AI computing', provider: 'akshare', refresh: false }));
    expect(getHotspotDetail).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Robotics actuator/ }));

    await waitFor(() =>
      expect(getHotspotDetail).toHaveBeenLastCalledWith({ topic: 'Robotics actuator', provider: 'akshare', refresh: false }),
    );
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(getHotspotDetail).toHaveBeenCalledTimes(2);
  });

  it('clears loaded hotspot detail while loading a different theme', async () => {
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    getHotspots.mockResolvedValueOnce({
      enabled: true,
      provider: 'akshare',
      providerUsed: 'akshare',
      hotspots: [
        {
          topic: 'AI computing',
          name: 'AI computing',
          heatScore: 88,
          stage: 'Accelerating主升',
        },
        {
          topic: 'Robotics actuator',
          name: 'Robotics actuator',
          heatScore: 80,
          stage: '轮动扩散',
        },
      ],
      hotspotCount: 2,
    });

    const robotDetail = createDeferred<unknown>();
    getHotspotDetail
      .mockResolvedValueOnce({
        enabled: true,
        provider: 'akshare',
        topic: 'AI computing',
        name: 'AI computing',
        summary: 'AICompute Intraday发酵。',
        route: [{ title: 'Intraday发酵', description: '出现大笔Buy。', source: 'eastmoney_board_change' }],
        stocks: [{ code: '300000', name: 'Innolight', role: '核心龙头', hotStockScore: 88 }],
        stockCount: 1,
      })
      .mockImplementationOnce(({ topic }: { topic: string }) => {
        if (topic === 'Robotics actuator') {
          return robotDetail.promise;
        }
        return Promise.reject(new Error(`unexpected topic: ${topic}`));
      });

    render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Expand热点题材/ }));
    fireEvent.click(await screen.findByRole('button', { name: /AI computing/ }));
    expect(await screen.findByText('Intraday发酵')).toBeInTheDocument();
    expect(screen.getByText('Innolight')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Robotics actuator/ }));

    await waitFor(() =>
      expect(getHotspotDetail).toHaveBeenLastCalledWith({ topic: 'Robotics actuator', provider: 'akshare', refresh: false }),
    );
    expect(screen.getAllByText('Robotics actuator').length).toBeGreaterThan(0);
    expect(screen.getByText('正在补充Detail')).toBeInTheDocument();
    expect(screen.getByText('当前发酵')).toBeInTheDocument();
    expect(screen.queryByText('Intraday发酵')).not.toBeInTheDocument();
    expect(screen.queryByText('Innolight')).not.toBeInTheDocument();

    await act(async () => {
      robotDetail.resolve({
        enabled: true,
        provider: 'akshare',
        topic: 'Robotics actuator',
        name: 'Robotics actuator',
        summary: 'Robotics actuator Continue发酵。',
        route: [{ title: 'Robotics发酵', description: '执行器链条扩散。', source: 'eastmoney_board_change' }],
        stocks: [{ code: '300111', name: 'Robotics龙头', role: '核心龙头', hotStockScore: 86 }],
        stockCount: 1,
      });
    });

    expect(await screen.findByText('Robotics发酵')).toBeInTheDocument();
    expect(screen.getByText('Robotics龙头')).toBeInTheDocument();
  });

  it('ignores stale hotspot detail responses when switching themes', async () => {
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    getHotspots.mockResolvedValueOnce({
      enabled: true,
      provider: 'akshare',
      providerUsed: 'akshare',
      hotspots: [
        {
          topic: 'AI computing',
          name: 'AI computing',
          heatScore: 88,
          stage: 'Accelerating主升',
        },
        {
          topic: 'Robotics actuator',
          name: 'Robotics actuator',
          heatScore: 80,
          stage: '轮动扩散',
        },
      ],
      hotspotCount: 2,
    });

    const aiDetail = createDeferred<unknown>();
    const robotDetail = createDeferred<unknown>();
    getHotspotDetail.mockImplementation(({ topic }: { topic: string }) => {
      if (topic === 'AI computing') {
        return aiDetail.promise;
      }
      if (topic === 'Robotics actuator') {
        return robotDetail.promise;
      }
      return Promise.reject(new Error(`unexpected topic: ${topic}`));
    });

    render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Expand热点题材/ }));
    fireEvent.click(await screen.findByRole('button', { name: /AI computing/ }));
    await waitFor(() => expect(getHotspotDetail).toHaveBeenCalledWith({ topic: 'AI computing', provider: 'akshare', refresh: false }));

    fireEvent.click(screen.getByRole('button', { name: /Robotics actuator/ }));

    await waitFor(() =>
      expect(getHotspotDetail).toHaveBeenLastCalledWith({ topic: 'Robotics actuator', provider: 'akshare', refresh: false }),
    );
    await act(async () => {
      robotDetail.resolve({
        enabled: true,
        provider: 'akshare',
        topic: 'Robotics actuator',
        name: 'Robotics actuator',
        summary: 'Robotics actuator Continue发酵。',
        route: [{ title: 'Robotics发酵', description: '执行器链条扩散。', source: 'eastmoney_board_change' }],
        stocks: [{ code: '300111', name: 'Robotics龙头', role: '核心龙头', hotStockScore: 86 }],
        stockCount: 1,
      });
    });

    expect(await screen.findByText('Robotics发酵')).toBeInTheDocument();

    await act(async () => {
      aiDetail.resolve({
        enabled: true,
        provider: 'akshare',
        topic: 'AI computing',
        name: 'AI computing',
        summary: 'AICompute 旧Response。',
        route: [{ title: 'AI旧发酵', description: '旧Request晚到。', source: 'eastmoney_board_change' }],
        stocks: [{ code: '300000', name: 'Innolight', role: '核心龙头', hotStockScore: 88 }],
        stockCount: 1,
      });
    });

    expect(screen.getByText('Robotics发酵')).toBeInTheDocument();
    expect(screen.getByText('Robotics龙头')).toBeInTheDocument();
    expect(screen.queryByText('AI旧发酵')).not.toBeInTheDocument();
    expect(screen.queryByText('Innolight')).not.toBeInTheDocument();
  });

  it('refreshes selected hotspot detail when refreshing the list retains the same topic', async () => {
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    getHotspots
      .mockResolvedValueOnce({
        enabled: true,
        provider: 'akshare',
        providerUsed: 'akshare',
        hotspots: [
          {
            topic: 'AI computing',
            name: 'AI computing',
            heatScore: 88,
            stage: 'Accelerating主升',
          },
          {
            topic: 'Robotics actuator',
            name: 'Robotics actuator',
            heatScore: 80,
            stage: '轮动扩散',
          },
        ],
        hotspotCount: 2,
      })
      .mockResolvedValueOnce({
        enabled: true,
        provider: 'akshare',
        providerUsed: 'akshare',
        hotspots: [
          {
            topic: 'AI computing',
            name: 'AI computing',
            heatScore: 91,
            stage: '高位发酵',
          },
        ],
        hotspotCount: 1,
      });
    getHotspotDetail
      .mockResolvedValueOnce({
        enabled: true,
        provider: 'akshare',
        topic: 'AI computing',
        name: 'AI computing',
        summary: 'AICompute Intraday发酵。',
        route: [{ title: 'Intraday发酵', description: '出现大笔Buy。', source: 'eastmoney_board_change' }],
        stocks: [{ code: '300000', name: 'Innolight', role: '核心龙头', hotStockScore: 88 }],
        stockCount: 1,
      })
      .mockResolvedValueOnce({
        enabled: true,
        provider: 'akshare',
        topic: 'AI computing',
        name: 'AI computing',
        summary: 'AICompute Refresh后发酵。',
        route: [{ title: 'Refresh后发酵', description: '榜单与Detail来自同次Refresh。', source: 'eastmoney_board_change' }],
        stocks: [{ code: '601138', name: 'Foxconn Industrial Internet', role: '核心龙头', hotStockScore: 92 }],
        stockCount: 1,
      });

    render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Expand热点题材/ }));
    fireEvent.click(await screen.findByRole('button', { name: /AI computing/ }));
    await waitFor(() => expect(getHotspotDetail).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /Refresh热点题材/ }));

    await waitFor(() => expect(getHotspots).toHaveBeenCalledWith({ provider: 'akshare', top: 12, refresh: true }));
    await waitFor(() => expect(getHotspotDetail).toHaveBeenLastCalledWith({
      topic: 'AI computing',
      provider: 'akshare',
      refresh: true,
    }));
    expect(await screen.findByText('Refresh后发酵')).toBeInTheDocument();
    expect(screen.getByText('Foxconn Industrial Internet')).toBeInTheDocument();
    expect(screen.queryByText('Intraday发酵')).not.toBeInTheDocument();
    expect(screen.queryByText('Innolight')).not.toBeInTheDocument();
  });

  it('keeps existing hotspot cards when manual refresh fails', async () => {
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    getHotspots
      .mockResolvedValueOnce({
        enabled: true,
        provider: 'akshare',
        providerUsed: 'akshare',
        hotspots: [
          {
            topic: 'AI computing',
            name: 'AI computing',
            heatScore: 88,
            trendScore: 12,
            persistenceScore: 66,
            changePct: 4.2,
            stage: 'Accelerating主升',
            sampleStockCount: 8,
            leaders: ['Innolight', 'Foxconn Industrial Internet'],
          },
        ],
        hotspotCount: 1,
      })
      .mockRejectedValueOnce(new Error('manual refresh failed'));

    render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Expand热点题材/ }));
    expect(await screen.findByText('强势领先')).toBeInTheDocument();
    expect(screen.getByText(/Innolight、Foxconn Industrial Internet/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Refresh热点题材/ }));

    await waitFor(() => expect(getHotspots).toHaveBeenCalledWith({ provider: 'akshare', top: 12, refresh: true }));
    expect(await screen.findByText(/manual refresh failed/)).toBeInTheDocument();
    expect(screen.getByText('强势领先')).toBeInTheDocument();
    expect(screen.getByText(/Innolight、Foxconn Industrial Internet/)).toBeInTheDocument();
    expect(screen.queryByText(/点击Refresh后会拉取热点Theme/)).not.toBeInTheDocument();
  });

  it('shows input strategy when strategy is not in preset list', async () => {
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    screenStocks.mockResolvedValue({
      enabled: true,
      candidates: [],
      candidateCount: 0,
    });

    render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Strategy'), {
      target: { value: '__custom_strategy__' },
    });
    fireEvent.change(screen.getByLabelText('CustomStrategy ID'), {
      target: { value: 'custom_strategy_alpha' },
    });

    expect(screen.getByDisplayValue('custom_strategy_alpha')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /运行Screening/ }));
    await waitFor(() => expect(screenStocks).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText(/CustomStrategy \(custom_strategy_alpha\)/)).toBeInTheDocument());
  });

  it('uses supported Screening strategy ids and cn market', async () => {
    getStrategies.mockResolvedValueOnce({
      enabled: true,
      strategies: [
        { id: 'balanced_alpha', name: '平衡Screening', description: 'desc', category: 'Framework' },
        { id: 'capital_heat', name: '资金热度', description: 'desc', category: 'Momentum' },
        { id: 'dual_low', name: '双低', description: 'desc', category: 'Value' },
        { id: 'oversold_reversal', name: 'Oversold', description: 'desc', category: 'Reversal' },
        { id: 'shrink_pullback', name: '缩量回踩', description: 'desc', category: 'Trend' },
      ],
      strategyCount: 5,
    });
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    screenStocks.mockResolvedValue({
      enabled: true,
      candidates: [],
      candidateCount: 0,
    });

    render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();

    const marketSelect = screen.getByLabelText('Market') as HTMLSelectElement;
    expect(Array.from(marketSelect.options).map((option) => option.value)).toEqual(['cn']);

    const strategySelect = screen.getByLabelText('Strategy') as HTMLSelectElement;
    expect(Array.from(strategySelect.options).map((option) => option.textContent)).toEqual([
      '平衡Screening',
      '资金热度',
      '双低',
      'Oversold',
      '缩量回踩',
      'CustomStrategy…',
    ]);

    ['balanced_alpha', 'capital_heat', 'oversold_reversal', 'shrink_pullback'].forEach((id) => {
      fireEvent.change(strategySelect, { target: { value: id } });
      expect(strategySelect.value).toBe(id);
    });

    fireEvent.click(screen.getByRole('button', { name: /运行Screening/ }));
    await waitFor(() => expect(screenStocks).toHaveBeenCalledTimes(1));
    expect(screenStocks).toHaveBeenCalledWith({
      market: 'cn',
      strategy: 'shrink_pullback',
      maxResults: 3,
    });
  });

  it('clears previous screening candidates when strategy changes', async () => {
    getStrategies.mockResolvedValueOnce({
      enabled: true,
      strategies: [
        { id: 'dual_low', name: '双低Screening', description: 'desc', category: 'Value' },
        { id: 'capital_heat', name: '资金热度', description: 'desc', category: 'Momentum' },
      ],
      strategyCount: 2,
    });
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    screenStocks.mockResolvedValueOnce({
      enabled: true,
      candidates: [
        {
          rank: 1,
          code: '000001',
          name: '旧Strategyshares票',
          score: 88.5,
          reason: 'old result',
          raw: {},
        },
      ],
      candidateCount: 1,
    });

    render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /运行Screening/ }));

    expect(await screen.findByText('旧Strategyshares票')).toBeInTheDocument();
    expect(screen.getByText('ScreeningComplete')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Strategy'), { target: { value: 'capital_heat' } });

    expect(screen.queryByText('旧Strategyshares票')).not.toBeInTheDocument();
    expect(screen.queryByText('ScreeningComplete')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Strategy')).toHaveValue('capital_heat');
  });

  it('hands a screening candidate to DSA analysis with mapped skills', async () => {
    getStrategies.mockResolvedValueOnce({
      enabled: true,
      strategies: [
        {
          id: 'dual_low',
          name: '双低Screening',
          description: 'desc',
          category: 'Value',
          analysisSkills: ['growth_quality'],
        },
      ],
      strategyCount: 1,
    });
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    screenStocks.mockResolvedValueOnce({
      enabled: true,
      candidates: [
        {
          rank: 1,
          code: '600519',
          name: 'Kweichow Moutai',
          score: 88.5,
          reason: '候选摘要',
          raw: {},
        },
      ],
      candidateCount: 1,
    });

    render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /运行Screening/ }));
    expect(await screen.findByText('Kweichow Moutai')).toBeInTheDocument();
    const expandButton = screen.queryByRole('button', { name: 'Expand查看' });
    if (expandButton) {
      fireEvent.click(expandButton);
    }
    fireEvent.click(screen.getByRole('button', { name: '进一步深度Analyze' }));

    expect(navigate).toHaveBeenCalledWith('/', {
      state: {
        stockCode: '600519',
        stockName: 'Kweichow Moutai',
        autoAnalyze: true,
        selectionSource: 'screening_result',
        skills: ['growth_quality'],
      },
    });
  });

  it('restores an in-flight screening task after remounting the page', async () => {
    getScreeningStatus.mockResolvedValue({
      enabled: true,
      available: true,
    });
    screenStocks.mockResolvedValueOnce({
      enabled: true,
      candidates: [
        {
          rank: 1,
          code: '000001',
          name: 'Restore后的候选',
          score: 88.5,
          reason: 'restored result',
          raw: {},
        },
      ],
      candidateCount: 1,
    });
    getScreenTask
      .mockResolvedValueOnce({
        taskId: 'screen-task-1',
        traceId: 'screen-task-1',
        status: 'processing',
        progress: 35,
        message: '正在执行 Screening Screening',
        result: null,
      })
      .mockResolvedValueOnce({
        taskId: 'screen-task-1',
        traceId: 'screen-task-1',
        status: 'completed',
        progress: 100,
        message: '任务执行Complete',
        result: {
          enabled: true,
          candidates: [
            {
              rank: 1,
              code: '000001',
              name: 'Restore后的候选',
              score: 88.5,
              reason: 'restored result',
              raw: {},
            },
          ],
          candidateCount: 1,
        },
      });

    const firstRender = render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /运行Screening/ }));

    expect(await screen.findByText('ScreeningRunning')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('dsa.screening.activeScreenTask.v1')).toContain('screen-task-1');

    firstRender.unmount();
    render(<StockScreeningPage />);

    expect(await screen.findByText('Restore后的候选')).toBeInTheDocument();
    expect(screen.getByText('ScreeningComplete')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('dsa.screening.activeScreenTask.v1')).toBeNull();
  });

  it('keeps a restored screening task recoverable when status polling times out', async () => {
    getScreeningStatus.mockResolvedValue({
      enabled: true,
      available: true,
    });
    window.sessionStorage.setItem('dsa.screening.activeScreenTask.v1', JSON.stringify({
      taskId: 'screen-task-1',
      market: 'cn',
      strategy: 'dual_low',
      maxResults: 3,
    }));
    getScreenTask.mockRejectedValueOnce(Object.assign(new Error('timeout of 30000ms exceeded'), {
      code: 'ECONNABORTED',
    }));

    render(<StockScreeningPage />);

    await waitFor(() => expect(getScreenTask).toHaveBeenCalledTimes(1));
    expect(screen.getByText('ScreeningRunning')).toBeInTheDocument();
    expect(screen.getByText('Screening任务仍在后units运行，Status轮询暂时Timeout，将自动Retry。')).toBeInTheDocument();
    expect(screen.queryByText(/Connect上游服务Timeout/)).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem('dsa.screening.activeScreenTask.v1')).toContain('screen-task-1');
  });

  it('surfaces Screening LLM fallback instead of showing empty LLM fields as normal', async () => {
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    screenStocks.mockResolvedValueOnce({
      enabled: true,
      candidates: [
        {
          rank: 1,
          code: '000001',
          name: 'Ping An Bank',
          score: 88.5,
          reason: '本地后置Score: value_quality',
          amount: 1042000000,
          factorScores: {
            value: 87.44,
            liquidity: 93.33,
          },
          raw: {},
        },
      ],
      candidateCount: 1,
      snapshotCount: 5193,
      afterFilterCount: 20,
      llmRanked: false,
      rankingMode: 'factor',
      llmFailureReason: 'invalid_response',
      llmParseErrors: ['no_json_found'],
      warnings: ['LLM ranking failed, falling back to screen_score: Missing gemini_api_key'],
    });

    render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /运行Screening/ }));

    expect(await screen.findByText('当前使用因子Sort')).toBeInTheDocument();
    expect(screen.getByText(/缺少Available LLM API Key/)).toBeInTheDocument();
    expect(screen.queryByText(/Missing gemini_api_key/)).not.toBeInTheDocument();
    expect(screen.getByText(/Sort：OK性因子/)).toBeInTheDocument();
    expect(screen.getByText('因子Sort')).toBeInTheDocument();
    expect(screen.getByText(/主要优势：流动性 93、Valuation 87/)).toBeInTheDocument();
    expect(screen.queryByText(/LLM 已Fallback/)).not.toBeInTheDocument();
  });

  it('deduplicates Screening snapshot fallback warnings and source errors', async () => {
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    screenStocks.mockResolvedValueOnce({
      enabled: true,
      candidates: [
        {
          rank: 1,
          code: '601919',
          name: '中远海控',
          score: 82.88,
          llmScore: 82,
          riskLevel: 'low',
          raw: {},
        },
      ],
      candidateCount: 1,
      llmRanked: true,
      warnings: ['Snapshot source fallback: tushare: tushare trade_cal returned no open trading days'],
      sourceErrors: ['tushare: tushare trade_cal returned no open trading days'],
    });

    render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /运行Screening/ }));

    expect(await screen.findByText('Screeninginfo')).toBeInTheDocument();
    expect(screen.getAllByText('SourceFallback：tushare（交易日历暂无Available开市日）')).toHaveLength(1);
    expect(screen.queryByText(/trade_cal returned no open trading days/)).not.toBeInTheDocument();
  });

  it('sanitizes long Screening source diagnostics and keeps the alert constrained', async () => {
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    screenStocks.mockResolvedValueOnce({
      enabled: true,
      candidates: [
        {
          rank: 1,
          code: '600016',
          name: '民生Banking',
          score: 80.12,
          raw: {},
        },
      ],
      candidateCount: 1,
      llmRanked: true,
      warnings: [
        "Snapshot source fallback: efinance: HTTPConnectionPool(host='push2.eastmoney.com', port=80): Max retries exceeded with url: /api/qt/clist/get?pn=1&pz=200&po=1&fields=f12%2Cf14%2Cf2%2Cf3 (Caused by ProtocolError('Connection aborted.', RemoteDisconnected('Remote end closed connection without response')))",
        "Snapshot source fallback: akshare_em: ('Connection aborted.', RemoteDisconnected('Remote end closed connection without response'))",
      ],
    });

    render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /运行Screening/ }));

    const efinanceWarning = await screen.findByText('SourceFallback：efinance（NetworkConnect中断）');
    const alert = efinanceWarning.closest('[role="alert"]');
    expect(alert).toHaveClass('max-w-full');
    expect(efinanceWarning).toBeInTheDocument();
    expect(screen.getByText('SourceFallback：akshare_em（NetworkConnect中断）')).toBeInTheDocument();
    expect(screen.queryByText(/HTTPConnectionPool/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/api\/qt\/clist\/get/)).not.toBeInTheDocument();
    expect(screen.queryByText(/RemoteDisconnected/)).not.toBeInTheDocument();
  });

  it('shows DSA enrichment summary, news, and enrichment metadata', async () => {
    getScreeningStatus.mockResolvedValueOnce({
      enabled: true,
      available: true,
    });
    screenStocks.mockResolvedValueOnce({
      enabled: true,
      candidates: [
        {
          rank: 1,
          code: '600519',
          name: 'Kweichow Moutai',
          score: 91.2,
          reason: 'Screening pick',
          dsaAnalysisSummary: 'DSA quote: price 1688, change 1.2%; DSA news: Kweichow Moutai latest filing',
          dsaNews: [{ title: 'Kweichow Moutai latest filing', source: 'Test源' }],
          dsaContext: {
            enriched: true,
            warnings: ['stock_news_unavailable'],
          },
          raw: {},
        },
      ],
      candidateCount: 1,
      dsaEnrichment: {
        enabled: true,
        requestedCount: 1,
        enrichedCount: 1,
      },
    });

    render(<StockScreeningPage />);

    expect(await screen.findByText('Screening enabled')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /运行Screening/ }));

    expect(await screen.findByText('深度补充：1 / 1')).toBeInTheDocument();

    expect(screen.getByText('增强摘要')).toBeInTheDocument();
    expect(screen.getByText(/Quote：现价 1688/)).toBeInTheDocument();
    expect(screen.getByText('相关新闻')).toBeInTheDocument();
    expect(screen.getByText('Kweichow Moutai latest filing')).toBeInTheDocument();
    expect(screen.getByText('Data补充info')).toBeInTheDocument();
    expect(screen.getByText('stock_news_unavailable')).toBeInTheDocument();
  });
});
