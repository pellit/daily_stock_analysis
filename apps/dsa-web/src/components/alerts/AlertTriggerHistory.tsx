import type React from 'react';
import { Activity } from 'lucide-react';
import { useUiLanguage } from '../../contexts/UiLanguageContext';
import type { ReportLanguage } from '../../types/analysis';
import type { AlertTriggerItem } from '../../types/alerts';
import { Badge, Card, EmptyState, Loading } from '../common';
import { formatDateTime } from '../../utils/format';
import { getMarketPhaseSummaryLabel } from '../../utils/marketPhase';

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'triggered') return 'success';
  if (status === 'skipped' || status === 'degraded') return 'warning';
  if (status === 'failed') return 'danger';
  return 'default';
}

function formatNullable(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '--';
  return String(value);
}

interface AlertTriggerHistoryProps {
  triggers: AlertTriggerItem[];
  isLoading?: boolean;
}

export const AlertTriggerHistory: React.FC<AlertTriggerHistoryProps> = ({ triggers, isLoading = false }) => {
  const { language, t } = useUiLanguage();
  const reportLanguage = language as ReportLanguage;
  const statusLabel: Record<string, string> = {
    triggered: t('alerts.triggerStatus.triggered'),
    skipped: t('alerts.triggerStatus.skipped'),
    degraded: t('alerts.triggerStatus.degraded'),
    failed: t('alerts.triggerStatus.failed'),
  };
  const stripPhasePrefix = (value: string): string =>
    value.replace(/^Market phase:\s*/i, '').replace(/^市场阶段[::]\s*/u, '');
  const renderPhaseQuality = (trigger: AlertTriggerItem): React.ReactNode => {
    const phase = getMarketPhaseSummaryLabel(trigger.marketPhaseSummary, reportLanguage);
    const quality = trigger.analysisContextPackOverview?.dataQuality?.level;
    const limitations = trigger.analysisContextPackOverview?.dataQuality?.limitations?.slice(0, 2) ?? [];
    if (!phase && !quality && limitations.length === 0) {
      return <span className="text-xs text-muted-text">--</span>;
    }
    return (
      <div className="space-y-1">
        {phase ? <Badge variant="default">{stripPhasePrefix(phase)}</Badge> : null}
        {quality ? (
          <div className="text-xs text-secondary-text">{t('alerts.triggerHistory.quality', { quality })}</div>
        ) : null}
        {limitations.length ? (
          <div className="max-w-[180px] text-xs text-muted-text">{limitations.join('; ')}</div>
        ) : null}
      </div>
    );
  };

  return (
    <Card title={t('alerts.triggerHistory.title')} subtitle={t('alerts.triggerHistory.subtitle')} variant="bordered" padding="md">
      {isLoading ? <Loading label={t('alerts.triggerHistory.loading')} /> : null}
      {!isLoading && triggers.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-6 w-6" />}
          title={t('alerts.triggerHistory.emptyTitle')}
          description={t('alerts.triggerHistory.emptyDescription')}
        />
      ) : null}
      {!isLoading && triggers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-border/60 text-xs uppercase text-muted-text">
              <tr>
                <th className="px-3 py-2 font-medium">{t('alerts.triggerHistory.column.status')}</th>
                <th className="px-3 py-2 font-medium">{t('alerts.triggerHistory.column.phaseQuality')}</th>
                <th className="px-3 py-2 font-medium">{t('alerts.triggerHistory.column.target')}</th>
                <th className="px-3 py-2 font-medium">{t('alerts.triggerHistory.column.observedValue')}</th>
                <th className="px-3 py-2 font-medium">{t('alerts.triggerHistory.column.threshold')}</th>
                <th className="px-3 py-2 font-medium">{t('alerts.triggerHistory.column.dataSource')}</th>
                <th className="px-3 py-2 font-medium">{t('alerts.triggerHistory.column.dataTime')}</th>
                <th className="px-3 py-2 font-medium">{t('alerts.triggerHistory.column.reason')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {triggers.map((trigger) => (
                <tr key={trigger.id} className="align-top">
                  <td className="px-3 py-3">
                    <Badge variant={statusVariant(trigger.status)}>
                      {statusLabel[trigger.status] ?? trigger.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">{renderPhaseQuality(trigger)}</td>
                  <td className="px-3 py-3 font-mono text-secondary-text">{trigger.target}</td>
                  <td className="px-3 py-3 text-secondary-text">{formatNullable(trigger.observedValue)}</td>
                  <td className="px-3 py-3 text-secondary-text">{formatNullable(trigger.threshold)}</td>
                  <td className="px-3 py-3 text-secondary-text">{formatNullable(trigger.dataSource)}</td>
                  <td className="px-3 py-3 text-xs text-secondary-text">
                    {formatDateTime(trigger.dataTimestamp ?? trigger.triggeredAt)}
                  </td>
                  <td className="px-3 py-3 text-secondary-text">
                    {trigger.reason || trigger.diagnostics || '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Card>
  );
};
