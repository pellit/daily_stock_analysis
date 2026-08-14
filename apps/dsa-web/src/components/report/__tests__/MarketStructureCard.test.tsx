import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MarketStructureContext } from '../../../types/analysis';
import { MarketStructureCard } from '../MarketStructureCard';

const context: MarketStructureContext = {
  schemaVersion: 'market-structure-v1',
  status: 'partial',
  market: 'cn',
  tradeDate: '2026-07-04',
  marketThemeContext: {
    schemaVersion: 'market-theme-v1',
    status: 'partial',
    market: 'cn',
    activeThemes: [
      { name: 'RoboticsTheme', changePct: 4.2, rank: 1, source: 'concept', phase: 'accelerating' },
    ],
    leadingConcepts: [
      { name: 'RoboticsTheme', changePct: 4.2, rank: 1, source: 'concept' },
    ],
    leadingIndustries: [
      { name: 'General设备', changePct: 2.1, rank: 2, source: 'industry' },
    ],
    laggingThemes: [],
    themeBreadth: {
      activeCount: 1,
      leadingConceptCount: 1,
      leadingIndustryCount: 1,
      laggingCount: 0,
    },
    dataQuality: {
      status: 'partial',
      missingFields: ['industry_rankings'],
      sources: [],
      errors: [],
    },
  },
  stockMarketPosition: {
    schemaVersion: 'stock-market-position-v1',
    status: 'partial',
    stockCode: '300024',
    stockName: 'Robotics',
    market: 'cn',
    primaryTheme: {
      name: 'RoboticsTheme',
      source: 'concept',
      phase: 'accelerating',
      rank: 1,
      changePct: 4.2,
    },
    relatedBoards: [
      { name: 'RoboticsTheme', type: 'Theme', source: 'concept', rank: 1, changePct: 4.2 },
    ],
    stockRole: 'follower',
    themePhase: 'accelerating',
    riskTags: [
      { code: 'theme_data_partial', message: '题材主线Data不Complete' },
      { code: 'stock_theme_evidence_partial', message: '个sharesSector未匹配到Market题材榜单，个shares位置按FallbackEvidence处理' },
    ],
    missingFields: ['hotspot_constituents', 'leader_stocks'],
  },
};

describe('MarketStructureCard', () => {
  it('renders market layer and stock layer in Chinese', () => {
    render(<MarketStructureCard context={context} language="zh" />);

    expect(screen.getByRole('region', { name: '题材主线与个shares位置' })).toBeInTheDocument();
    expect(screen.getByText('Market题材层')).toBeVisible();
    expect(screen.getByText('个shares位置层')).toBeVisible();
    expect(screen.getAllByText('PartialAvailable')).toHaveLength(3);
    expect(screen.getAllByText(/RoboticsTheme/)).toHaveLength(3);
    expect(screen.getByText('Accelerating')).toBeVisible();
    expect(screen.getByText('跟随')).toBeVisible();
    expect(screen.getByText('题材主线Data不Complete')).toBeVisible();
    expect(screen.getByText('leader_stocks')).toBeVisible();
  });

  it('renders English labels', () => {
    render(<MarketStructureCard context={context} language="en" />);

    expect(screen.getByRole('region', { name: 'Themes and Stock Position' })).toBeInTheDocument();
    expect(screen.getByText('Market Theme Layer')).toBeVisible();
    expect(screen.getByText('Stock Position Layer')).toBeVisible();
    expect(screen.getByText('Accelerating')).toBeVisible();
    expect(screen.getByText('Follower')).toBeVisible();
    expect(screen.getByText('Missing Evidence')).toBeVisible();
    expect(screen.getByText('Market theme data is incomplete')).toBeVisible();
    expect(screen.getByText('Stock board did not match theme rankings')).toBeVisible();
    expect(screen.queryByText('题材主线Data不Complete')).not.toBeInTheDocument();
  });

  it('renders Korean labels', () => {
    render(<MarketStructureCard context={context} language="ko" />);

    expect(screen.getByRole('region', { name: '테마 라인 및 종목 포지션' })).toBeInTheDocument();
    expect(screen.getByText('시장 테마 레이어')).toBeVisible();
    expect(screen.getByText('종목 포지션 레이어')).toBeVisible();
    expect(screen.getByText('가속')).toBeVisible();
    expect(screen.getByText('추종')).toBeVisible();
    expect(screen.getByText('테마 데이터가 불완전합니다')).toBeVisible();
    expect(screen.getByText('종목 보드가 테마 랭킹과 일치하지 않았습니다')).toBeVisible();
  });

  it('does not render unsupported or invalid context', () => {
    const unsupported = {
      ...context,
      status: 'not_supported',
    } satisfies MarketStructureContext;

    const { container, rerender } = render(<MarketStructureCard context={unsupported} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<MarketStructureCard context={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
