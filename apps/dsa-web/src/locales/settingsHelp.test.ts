import { describe, expect, it } from 'vitest';

import { getSettingsHelpContent } from './settingsHelp';
import { getFieldDescription } from '../utils/systemConfigI18n';

const flattenHelp = (help: ReturnType<typeof getSettingsHelpContent>) => [
  help?.summary,
  help?.usage,
  ...(help?.valueNotes ?? []),
  ...(help?.impact ?? []),
  ...(help?.notes ?? []),
].filter(Boolean).join(' ');

describe('Skill Outcome auto-weight settings help', () => {
  it('describes the attributable Outcome threshold in English', () => {
    const help = getSettingsHelpContent(
      'settings.agent.AGENT_SKILL_AUTOWEIGHT',
      undefined,
    );
    const visibleCopy = flattenHelp(help);

    expect(visibleCopy).toContain('Outcome');
    expect(visibleCopy).toContain('30');
    expect(visibleCopy).toContain('1.0');
    expect(visibleCopy).toContain('Global backtest win rates never substitute');
    expect(visibleCopy).not.toContain('Depends on backtest');
    expect(getFieldDescription('AGENT_SKILL_AUTOWEIGHT')).toContain('Outcome');
  });

  it('does not present Backtest as the Skill auto-weight data source', () => {
    const enHelp = flattenHelp(getSettingsHelpContent(
      'settings.backtest.BACKTEST_ENABLED',
      undefined,
    ));

    expect(enHelp).toContain('Skill Outcome');
    expect(enHelp).toContain('does not directly');
  });
});
