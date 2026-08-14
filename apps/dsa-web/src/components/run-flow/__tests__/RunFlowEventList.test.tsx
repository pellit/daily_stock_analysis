import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { RunFlowEvent } from '../../../types/runFlow';
import { RunFlowEventList } from '../RunFlowEventList';

const events: RunFlowEvent[] = [
  {
    id: 'evt-1',
    timestamp: '2026-06-08T08:00:01Z',
    severity: 'info',
    type: 'task_created',
    nodeId: 'request',
    title: '任务Create',
  },
  {
    id: 'evt-2',
    timestamp: '2026-06-08T08:00:02Z',
    severity: 'warning',
    type: 'provider_fallback',
    nodeId: 'daily_data',
    title: 'DailyFallback',
    message: 'Fallback to AkShare after Tushare failure',
  },
  {
    id: 'evt-3',
    timestamp: '2026-06-08T08:00:03Z',
    severity: 'danger',
    type: 'task_cancelled',
    nodeId: 'queue',
    title: '任务Cancel',
  },
];

describe('RunFlowEventList', () => {
  it('filters fallback and cancellation events with visible text labels', () => {
    render(<RunFlowEventList events={events} />);

    expect(screen.getByText('任务Create')).toBeInTheDocument();
    expect(screen.getByText('DailyFallback')).toBeInTheDocument();
    expect(screen.getByText('任务Cancel')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fallback/retry' }));

    expect(screen.getByText('DailyFallback')).toBeInTheDocument();
    expect(screen.queryByText('任务Create')).not.toBeInTheDocument();
    expect(screen.queryByText('任务Cancel')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('任务Cancel')).toBeInTheDocument();
    expect(screen.queryByText('DailyFallback')).not.toBeInTheDocument();
    expect(screen.getByText('Danger')).toBeInTheDocument();
  });

  it('selects the event node when an event row is clicked', () => {
    const onSelectNode = vi.fn();
    render(<RunFlowEventList events={events} onSelectNode={onSelectNode} />);

    fireEvent.click(screen.getByRole('button', { name: '查看事件 DailyFallback 关联节点' }));

    expect(onSelectNode).toHaveBeenCalledWith('daily_data');
  });
});
