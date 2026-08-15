import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportOverview } from '../ReportOverview';

const baseMeta = {
  queryId: 'q-1',
  stockCode: '600519',
  stockName: 'Kweichow Moutai',
  reportType: 'detailed' as const,
  reportLanguage: 'zh' as const,
  createdAt: '2026-03-21T08:00:00Z',
};

const baseSummary = {
  analysisSummary: 'Trendmaintainstrong',
  operationAdvice: 'ContinueWatchentry point',
  trendPrediction: 'short-termRangerelatively strong',
  sentimentScore: 78,
};

describe('ReportOverview', () => {
  it('renders final market phase and partial-bar labels from report metadata', () => {
    render(
      <ReportOverview
        meta={{
          ...baseMeta,
          marketPhaseSummary: {
            market: 'cn',
            phase: 'intraday',
            marketLocalTime: '2026-03-21T10:30:00+08:00',
            sessionDate: '2026-03-21',
            effectiveDailyBarDate: '2026-03-20',
            isTradingDay: true,
            isMarketOpenNow: true,
            isPartialBar: true,
            minutesToOpen: null,
            minutesToClose: 150,
            triggerSource: 'api',
            analysisIntent: 'auto',
            warnings: [],
          },
        }}
        summary={baseSummary}
      />,
    );

    expect(screen.getByLabelText('MarketPhase: CN · Intraday')).toBeInTheDocument();
    expect(screen.getByText('MarketPhase: CN · Intraday')).toBeVisible();
    expect(screen.getByLabelText('Dailynot Complete')).toBeInTheDocument();
  });

  it('renders English final market phase and partial-bar labels', () => {
    render(
      <ReportOverview
        meta={{
          ...baseMeta,
          reportLanguage: 'en',
          marketPhaseSummary: {
            market: 'us',
            phase: 'postmarket',
            marketLocalTime: '2026-03-21T16:30:00-04:00',
            sessionDate: '2026-03-21',
            effectiveDailyBarDate: '2026-03-21',
            isTradingDay: true,
            isMarketOpenNow: false,
            isPartialBar: true,
            minutesToOpen: null,
            minutesToClose: null,
            triggerSource: 'api',
            analysisIntent: 'auto',
            warnings: [],
          },
        }}
        summary={baseSummary}
      />,
    );

    expect(screen.getByLabelText('Market phase: US · Post-market')).toBeInTheDocument();
    expect(screen.getByLabelText('Partial bar')).toBeInTheDocument();
  });

  it('renders unknown final phase without partial-bar label', () => {
    render(
      <ReportOverview
        meta={{
          ...baseMeta,
          marketPhaseSummary: {
            market: null,
            phase: 'unknown',
            marketLocalTime: null,
            sessionDate: null,
            effectiveDailyBarDate: null,
            isTradingDay: null,
            isMarketOpenNow: null,
            isPartialBar: false,
            minutesToOpen: null,
            minutesToClose: null,
            triggerSource: 'api',
            analysisIntent: 'auto',
            warnings: ['calendar_unavailable'],
          },
        }}
        summary={baseSummary}
      />,
    );

    expect(screen.getByText('MarketPhase: PhaseUnknown')).toBeVisible();
    expect(screen.queryByText('Dailynot Complete')).not.toBeInTheDocument();
  });

  it('does not render a market phase placeholder for legacy reports', () => {
    render(<ReportOverview meta={baseMeta} summary={baseSummary} />);

    expect(screen.queryByText(/MarketPhase/)).not.toBeInTheDocument();
    expect(screen.queryByText('Dailynot Complete')).not.toBeInTheDocument();
  });

  it('renders related boards with leading and lagging markers', () => {
    render(
      <ReportOverview
        meta={baseMeta}
        summary={baseSummary}
        details={{
          belongBoards: [
            { name: ' Liquor ', type: 'Sector' },
            { name: 'Consumer', type: 'Theme' },
            { name: 'New energy' },
          ],
          sectorRankings: {
            top: [{ name: 'Liquor', changePct: 2.31 }],
            bottom: [{ name: 'New energy', changePct: -1.2 }],
          },
          conceptRankings: {
            top: [{ name: 'Consumer', changePct: 4.56 }],
            bottom: [],
          },
        }}
      />,
    );

    expect(screen.getByText('关LianSector')).toBeInTheDocument();
    expect(screen.getByText('Liquor')).toBeInTheDocument();
    expect(screen.getAllByText('Leading')).toHaveLength(2);
    expect(screen.getByText('+2.31%')).toBeInTheDocument();
    expect(screen.getByText('+4.56%')).toBeInTheDocument();
    expect(screen.getByText('Lagging')).toBeInTheDocument();
    expect(screen.getByText('-1.20%')).toBeInTheDocument();
    expect(screen.queryByText('neutral')).not.toBeInTheDocument();
  });

  it('does not apply industry ranking to a concept board with the same name', () => {
    render(
      <ReportOverview
        meta={baseMeta}
        summary={baseSummary}
        details={{
          belongBoards: [{ name: 'Liquor', type: 'Theme' }],
          sectorRankings: {
            top: [{ name: 'Liquor', changePct: 2.31 }],
            bottom: [],
          },
          conceptRankings: {
            top: [],
            bottom: [{ name: 'Liquor', changePct: -3.2 }],
          },
        }}
      />,
    );

    expect(screen.getByText('Liquor')).toBeInTheDocument();
    expect(screen.getByText('关LianSector')).toBeInTheDocument();
    expect(screen.getByText('Lagging')).toBeInTheDocument();
    expect(screen.getByText('-3.20%')).toBeInTheDocument();
    expect(screen.queryByText('+2.31%')).not.toBeInTheDocument();
  });

  it('renders untyped boards in a single related-board row with ranking matches', () => {
    const conceptRankingBoard = '榜formsampleexample甲';
    const fallbackConceptBoard = 'not 标NoteSector';
    const sectorRankingBoard = '榜formsampleexample乙';

    render(
      <ReportOverview
        meta={baseMeta}
        summary={baseSummary}
        details={{
          belongBoards: [
            { name: conceptRankingBoard },
            { name: fallbackConceptBoard },
            { name: sectorRankingBoard },
          ],
          sectorRankings: {
            top: [{ name: sectorRankingBoard, changePct: 1.11 }],
            bottom: [],
          },
          conceptRankings: {
            top: [{ name: conceptRankingBoard, changePct: 3.21 }],
            bottom: [],
          },
        }}
      />,
    );

    const relatedBoardsRegion = screen.getByRole('region', { name: '关LianSector' });

    expect(within(relatedBoardsRegion).getByText(sectorRankingBoard)).toBeInTheDocument();
    expect(within(relatedBoardsRegion).getByText(conceptRankingBoard)).toBeInTheDocument();
    expect(within(relatedBoardsRegion).getByText(fallbackConceptBoard)).toBeInTheDocument();
    expect(within(relatedBoardsRegion).getByText('+3.21%')).toBeInTheDocument();
  });

  it('places related boards below action advice in one horizontal row', () => {
    const { container } = render(
      <ReportOverview
        meta={baseMeta}
        summary={baseSummary}
        details={{
          belongBoards: [
            { name: 'Liquor', type: 'Sector' },
            { name: 'Consumer', type: 'Theme' },
            { name: 'high端制造' },
            { name: '沪sharesThrough' },
          ],
        }}
      />,
    );

    const actionAdviceTitle = screen.getByText('ActionRecommend');
    const relatedBoardsRegion = screen.getByRole('region', { name: '关LianSector' });
    const boardLists = container.querySelectorAll('.home-related-board-list');

    expect(actionAdviceTitle.compareDocumentPosition(relatedBoardsRegion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('关LianSector')).toBeInTheDocument();
    expect(screen.getByText('沪sharesThrough')).toBeInTheDocument();
    expect(boardLists[0]).toHaveClass(
      'flex-nowrap',
      'overflow-x-auto',
      'w-full',
      'min-w-0',
      'max-w-full',
      'touch-pan-x',
    );
  });

  it('shows board list when rankings are unavailable', () => {
    render(
      <ReportOverview
        meta={baseMeta}
        summary={baseSummary}
        details={{
          belongBoards: [{ name: 'Semiconductors', type: 'Sector' }],
        }}
      />,
    );

    expect(screen.getByText('关LianSector')).toBeInTheDocument();
    expect(screen.getByText('Semiconductors')).toBeInTheDocument();
    expect(screen.queryByText('neutral')).not.toBeInTheDocument();
    expect(screen.queryByText('Leading')).not.toBeInTheDocument();
    expect(screen.queryByText('Lagging')).not.toBeInTheDocument();
  });

  it('shows only the board when a matching ranking has no change percent', () => {
    render(
      <ReportOverview
        meta={baseMeta}
        summary={baseSummary}
        details={{
          belongBoards: [{ name: 'Liquor', type: 'Sector' }],
          sectorRankings: {
            top: [{ name: 'Liquor' }],
            bottom: [],
          },
        }}
      />,
    );

    expect(screen.getByText('关LianSector')).toBeInTheDocument();
    expect(screen.getByText('Liquor')).toBeInTheDocument();
    expect(screen.queryByText('Sector')).not.toBeInTheDocument();
    expect(screen.queryByText('Leading')).not.toBeInTheDocument();
    expect(screen.queryByText('Lagging')).not.toBeInTheDocument();
  });

  it('hides related boards section when no boards are available', () => {
    render(<ReportOverview meta={baseMeta} summary={baseSummary} details={{ belongBoards: [] }} />);

    expect(screen.queryByText('Sectorlinked')).not.toBeInTheDocument();
  });

  it('fails open on malformed ranking payloads', () => {
    render(
      <ReportOverview
        meta={baseMeta}
        summary={baseSummary}
        details={{
          belongBoards: [{ name: ' Liquor ' }],
          sectorRankings: {
            top: {} as unknown as never[],
            bottom: [{ name: 'Liquor', changePct: '-2.5%' as unknown as number }],
          },
        }}
      />,
    );

    expect(screen.getByText('关LianSector')).toBeInTheDocument();
    expect(screen.getByText('Liquor')).toBeInTheDocument();
    expect(screen.getByText('Lagging')).toBeInTheDocument();
    expect(screen.getByText('-2.50%')).toBeInTheDocument();
  });
});
