import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskPanel } from '../TaskPanel';
import type { TaskInfo } from '../../../types/analysis';

const baseTask: TaskInfo = {
  taskId: 'task-1',
  stockCode: '600519',
  stockName: 'Kweichow Moutai',
  status: 'processing',
  progress: 40,
  message: '正在抓取LatestQuote',
  reportType: 'detailed',
  createdAt: '2026-03-21T08:00:00Z',
};

describe('TaskPanel', () => {
  it('renders requested analysis phase badges for active tasks', () => {
    render(
      <TaskPanel
        tasks={[
          {
            ...baseTask,
            analysisPhase: 'intraday',
          },
          {
            ...baseTask,
            taskId: 'task-2',
            stockCode: 'AAPL',
            stockName: 'Apple',
            status: 'pending',
            analysisPhase: 'auto',
          },
        ]}
      />,
    );

    expect(screen.getByLabelText('RequestPhase: Intraday')).toBeInTheDocument();
    expect(screen.getByLabelText('RequestPhase: 自动Phase')).toBeInTheDocument();
  });

  it('renders active tasks with preserved dashboard panel styling', () => {
    const { container } = render(
      <TaskPanel
        tasks={[
          {
            ...baseTask,
            traceId: 'trace-task-1',
          },
          {
            ...baseTask,
            taskId: 'task-2',
            stockCode: 'AAPL',
            stockName: 'Apple',
            status: 'pending',
            message: '等待AnalyzeQueue',
          },
        ]}
      />,
    );

    expect(screen.getByText('Analysis tasks')).toBeInTheDocument();
    expect(screen.getByText('1 In progress')).toBeInTheDocument();
    expect(screen.getByText('1 Waiting')).toBeInTheDocument();
    expect(screen.getByText('Kweichow Moutai')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByLabelText('任务Status：Analyzing')).toBeInTheDocument();
    expect(screen.getByText('Diagnostics')).toBeInTheDocument();
    expect(screen.getAllByText('trace-task-1')).toHaveLength(2);
    expect(screen.queryByText(/RequestPhase:/)).not.toBeInTheDocument();
    expect(container.querySelector('.home-panel-card')).toBeTruthy();
    expect(container.querySelector('.home-subpanel')).toBeTruthy();
  });

  it('collapses into a one-line summary and expands back with aria state', () => {
    render(
      <TaskPanel
        tasks={[
          {
            ...baseTask,
            progress: 40,
          },
          {
            ...baseTask,
            taskId: 'task-2',
            stockCode: 'AAPL',
            stockName: 'Apple',
            status: 'pending',
            progress: 0,
          },
        ]}
      />,
    );

    const collapseButton = screen.getByRole('button', { name: 'Collapse task panel' });
    expect(collapseButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(collapseButton);

    const expandButton = screen.getByRole('button', { name: 'Expand task panel' });
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('task-panel-collapsed-summary')).toHaveTextContent('1 In progress');
    expect(screen.getByTestId('task-panel-collapsed-summary')).toHaveTextContent('1 Waiting');
    expect(screen.getByTestId('task-panel-collapsed-summary')).toHaveTextContent('平均进度 40%');
    expect(screen.queryByTestId('task-panel-item')).not.toBeInTheDocument();

    fireEvent.click(expandButton);

    expect(screen.getByRole('button', { name: 'Collapse task panel' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByTestId('task-panel-item')).toHaveLength(2);
  });

  it('keeps narrow sidebar task metadata in rows instead of squeezing diagnostics vertically', () => {
    render(
      <TaskPanel
        tasks={[
          {
            ...baseTask,
            stockCode: '601869.SH',
            stockName: '长飞光纤',
            progress: 32,
            message: '长飞光纤: RequestPhase: 自动Phase',
            analysisPhase: 'auto',
            traceId: 'c5b9665a64e3b9f42ad9f',
          },
        ]}
        onOpenRunFlow={vi.fn()}
      />,
    );

    const item = screen.getByTestId('task-panel-item');
    expect(item).toHaveClass('grid');
    expect(item).not.toHaveClass('flex');
    expect(screen.getByText('长飞光纤')).toHaveClass('truncate');
    expect(screen.getByText('601869.SH')).toHaveClass('shrink-0');
    expect(screen.getByText('32%')).toBeInTheDocument();

    const diagnosticsSummary = screen.getByTestId('task-panel-diagnostics-summary');
    expect(diagnosticsSummary).toHaveClass('grid-cols-[auto_minmax(0,1fr)_auto]');
    expect(screen.getByText('Diagnostics')).toHaveClass('whitespace-nowrap');
    expect(screen.getByText('c5b9665a64...')).toHaveClass('truncate');
    expect(screen.getByRole('button', { name: '查看 长飞光纤 RUN FLOW' })).toBeInTheDocument();
  });

  it('opens the run-flow view from an active task icon button', () => {
    const onOpenRunFlow = vi.fn();
    render(
      <TaskPanel
        tasks={[baseTask]}
        onOpenRunFlow={onOpenRunFlow}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '查看 Kweichow Moutai RUN FLOW' }));

    expect(onOpenRunFlow).toHaveBeenCalledWith(baseTask);
  });

  it('keeps cancel-requested tasks visible without rendering them as failed', () => {
    render(
      <TaskPanel
        tasks={[
          {
            ...baseTask,
            status: 'cancel_requested',
            message: '正在Cancel requested',
          },
        ]}
      />,
    );

    expect(screen.getByText('Kweichow Moutai')).toBeInTheDocument();
    expect(screen.getByLabelText('任务Status：Cancel requested')).toBeInTheDocument();
    expect(screen.queryByText('Failure')).not.toBeInTheDocument();
  });

  it('does not keep cancelled terminal tasks in the active task panel', () => {
    const { container } = render(
      <TaskPanel
        tasks={[
          {
            ...baseTask,
            status: 'cancelled',
          },
        ]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('does not render when there are no active tasks', () => {
    const { container } = render(
      <TaskPanel
        tasks={[
          {
            ...baseTask,
            status: 'completed',
          },
        ]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
