import { StrictMode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { historyApi } from '../../../api/history';
import type { RunDiagnosticSummary } from '../../../types/analysis';
import { ReportDiagnostics } from '../ReportDiagnostics';

vi.mock('../../../api/history', () => ({
  historyApi: {
    getDiagnostics: vi.fn(),
  },
}));

const diagnosticSummary: RunDiagnosticSummary = {
  traceId: 'trace-1234567890abcdef',
  taskId: 'task-1',
  queryId: 'query-1',
  stockCode: '600519',
  triggerSource: 'web',
  status: 'degraded',
  statusLabel: 'Degraded',
  reason: '实hourQuote baostock Success, PrefixSourceFailureafter Continue',
  copyText: 'trace_id: trace-1234567890abcdef\ndata_status: degraded',
  components: {
    realtimeQuote: {
      key: 'realtime_quote',
      label: '实hourQuote',
      status: 'degraded',
      message: '实hourQuote baostock Success, PrefixSourceFailureafter Continue',
      details: {
        provider: 'baostock',
        attempts: 2,
      },
    },
    notification: {
      key: 'notification',
      label: 'Notification',
      status: 'not_configured',
      message: 'Notificationnot ConfigorthisSkip',
    },
  },
};

describe('ReportDiagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('loads historical diagnostics in a collapsed panel and copies sanitized text', async () => {
    vi.mocked(historyApi.getDiagnostics).mockResolvedValue(diagnosticSummary);

    render(<ReportDiagnostics recordId={1} />);

    expect(historyApi.getDiagnostics).toHaveBeenCalledWith(1);
    expect(await screen.findByText('RunStatus')).toBeInTheDocument();
    const panel = screen.getByTestId('run-diagnostics');
    expect(panel).not.toHaveAttribute('open');
    expect(screen.getByText('Degraded')).toBeInTheDocument();

    fireEvent.click(screen.getByText('RunStatus'));

    expect(panel).toHaveAttribute('open');
    expect(screen.getByText('最nearFailureafter Fallback')).toBeInTheDocument();
    expect(screen.getByText('not Config')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy排障Info' }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(diagnosticSummary.copyText);
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: ' Copy' })).toBeInTheDocument();
    });
  });

  it('uses the provided summary without fetching history diagnostics', () => {
    render(<ReportDiagnostics summary={diagnosticSummary} language="en" />);

    expect(historyApi.getDiagnostics).not.toHaveBeenCalled();
    expect(screen.getByText('Run Status')).toBeInTheDocument();
    expect(screen.getByText('Degraded')).toBeInTheDocument();
    expect(screen.getByText('Fetch / LLM / save / notification path')).toBeInTheDocument();
  });

  it('opens historical run flow from the diagnostics body', async () => {
    const onOpenRunFlow = vi.fn();
    vi.mocked(historyApi.getDiagnostics).mockResolvedValue(diagnosticSummary);

    render(<ReportDiagnostics recordId={1} onOpenRunFlow={onOpenRunFlow} />);

    fireEvent.click(await screen.findByText('RunStatus'));
    fireEvent.click(screen.getByRole('button', { name: 'ViewHistory 1 RUN FLOW' }));

    expect(onOpenRunFlow).toHaveBeenCalledWith(1);
  });

  it('refetches diagnostics after StrictMode cleans up the first effect run', async () => {
    vi.mocked(historyApi.getDiagnostics).mockResolvedValue(diagnosticSummary);

    render(
      <StrictMode>
        <ReportDiagnostics recordId={1} />
      </StrictMode>,
    );

    await waitFor(() => {
      expect(historyApi.getDiagnostics).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText('RunStatus')).toBeInTheDocument();
  });
});
