import { describe, expect, it } from 'vitest';
import { UI_TEXT } from '../src/i18n/uiText';
import { getSettingsHelpContent } from '../src/locales/settingsHelp';
import { getFieldDescription, getFieldOptionLabel, getFieldTitle } from '../src/utils/systemConfigI18n';

const requiredLocalizedKeys = [
  'TICKFLOW_API_KEY',
  'TICKFLOW_PRIORITY',
  'TICKFLOW_KLINE_ADJUST',
  'TICKFLOW_BATCH_DAILY_ENABLED',
  'TICKFLOW_BATCH_SIZE',
  'STOCK_INDEX_REMOTE_UPDATE_ENABLED',
  'SEARXNG_BASE_URLS',
  'ENABLE_REALTIME_QUOTE',
  'ENABLE_CHIP_DISTRIBUTION',
  'PYTDX_HOST',
  'PYTDX_PORT',
  'PYTDX_SERVERS',
  'BIAS_THRESHOLD',
  'GENERATION_BACKEND',
  'GENERATION_FALLBACK_BACKEND',
  'GENERATION_BACKEND_TIMEOUT_SECONDS',
  'GENERATION_BACKEND_MAX_OUTPUT_BYTES',
  'GENERATION_BACKEND_MAX_CONCURRENCY',
  'LOCAL_CLI_BACKEND_MAX_CONCURRENCY',
  'LLM_PROMPT_CACHE_TELEMETRY_ENABLED',
  'LLM_PROMPT_CACHE_HINTS_ENABLED',
  'LLM_PROMPT_CACHE_DIAGNOSTICS_LEVEL',
  'LLM_USAGE_HMAC_SECRET',
  'LLM_USAGE_HMAC_KEY_VERSION',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'TELEGRAM_MESSAGE_THREAD_ID',
  'FEISHU_STREAM_ENABLED',
  'DINGTALK_STREAM_ENABLED',
  'EMAIL_SENDER',
  'EMAIL_PASSWORD',
  'EMAIL_RECEIVERS',
  'DISCORD_WEBHOOK_URL',
  'DISCORD_BOT_TOKEN',
  'DISCORD_MAIN_CHANNEL_ID',
  'DISCORD_INTERACTIONS_PUBLIC_KEY',
  'SLACK_BOT_TOKEN',
  'SLACK_CHANNEL_ID',
  'SLACK_WEBHOOK_URL',
  'PUSHPLUS_TOPIC',
  'PUSHOVER_USER_KEY',
  'PUSHOVER_API_TOKEN',
  'SERVERCHAN3_SENDKEY',
  'ASTRBOT_URL',
  'ASTRBOT_TOKEN',
  'CUSTOM_WEBHOOK_BEARER_TOKEN',
  'WEBHOOK_VERIFY_SSL',
  'SINGLE_STOCK_NOTIFY',
  'REPORT_TYPE',
  'REPORT_LANGUAGE',
  'REPORT_TEMPLATES_DIR',
  'REPORT_INTEGRITY_ENABLED',
  'REPORT_RENDERER_ENABLED',
  'REPORT_INTEGRITY_RETRY',
  'REPORT_HISTORY_COMPARE_N',
  'MERGE_EMAIL_NOTIFICATION',
  'NOTIFICATION_REPORT_CHANNELS',
  'NOTIFICATION_ALERT_CHANNELS',
  'NOTIFICATION_SYSTEM_ERROR_CHANNELS',
  'NOTIFICATION_DEDUP_TTL_SECONDS',
  'NOTIFICATION_COOLDOWN_SECONDS',
  'NOTIFICATION_QUIET_HOURS',
  'NOTIFICATION_TIMEZONE',
  'NOTIFICATION_MIN_SEVERITY',
  'NOTIFICATION_DAILY_DIGEST_ENABLED',
  'SCHEDULE_ENABLED',
  'SCHEDULE_RUN_IMMEDIATELY',
  'TRADING_DAY_CHECK_ENABLED',
  'WEBUI_HOST',
  'LOG_DIR',
  'WEBUI_ENABLED',
  'WEBUI_AUTO_BUILD',
  'ADMIN_AUTH_ENABLED',
  'TRUST_X_FORWARDED_FOR',
  'RUN_IMMEDIATELY',
  'MARKET_REVIEW_ENABLED',
  'DAILY_MARKET_CONTEXT_ENABLED',
  'MARKET_REVIEW_REGION',
  'ANALYSIS_DELAY',
  'SAVE_CONTEXT_SNAPSHOT',
  'DEBUG',
  'AGENT_GENERATION_BACKEND',
  'AGENT_NL_ROUTING',
  'AGENT_DEEP_RESEARCH_BUDGET',
  'AGENT_DEEP_RESEARCH_TIMEOUT',
  'AGENT_EVENT_MONITOR_ENABLED',
  'AGENT_EVENT_MONITOR_INTERVAL_MINUTES',
  'AGENT_EVENT_ALERT_RULES_JSON',
] as const;

describe('systemConfigI18n required key coverage', () => {
  it('provides title and description mapping for known missing keys', () => {
    requiredLocalizedKeys.forEach((key) => {
      expect(getFieldTitle(key, key)).not.toBe(key);
      expect(getFieldDescription(key, 'schema fallback description')).not.toBe('schema fallback description');
    });
  });

  it('uses a primary title for SearXNG base URLs', () => {
    const title = getFieldTitle('SEARXNG_BASE_URLS', 'SEARXNG_BASE_URLS');

    expect(title).toBe('SearXNG self-hosted instance URLs');
    expect(title).not.toBe('SEARXNG_BASE_URLS');
  });

  it('documents LLM usage HMAC privacy boundaries', () => {
    const help = getSettingsHelpContent('settings.ai_model.LLM_USAGE_HMAC_SECRET', undefined);

    expect(help?.summary).toContain('HMAC');
    expect(help?.notes?.join(' ')).toContain('Do not');
  });
});

describe('systemConfigI18n option label localization', () => {
  const realSelectOptionCases = [
    ['NEWS_STRATEGY_PROFILE', 'ultra_short', undefined, 'Ultra short (1 day)'],
    ['NEWS_STRATEGY_PROFILE', 'short', undefined, 'Short (3 days)'],
    ['NEWS_STRATEGY_PROFILE', 'medium', undefined, 'Medium (7 days)'],
    ['NEWS_STRATEGY_PROFILE', 'long', undefined, 'Long (30 days)'],
    ['REPORT_TYPE', 'simple', undefined, 'Simple'],
    ['REPORT_TYPE', 'full', undefined, 'Full'],
    ['REPORT_TYPE', 'brief', undefined, 'Brief'],
    ['REPORT_LANGUAGE', 'zh', 'Chinese', 'Chinese'],
    ['REPORT_LANGUAGE', 'en', 'English', 'English'],
    ['REPORT_LANGUAGE', 'ko', 'Korean', 'Korean'],
    ['NOTIFICATION_MIN_SEVERITY', '', 'Not set', 'Not set'],
    ['NOTIFICATION_MIN_SEVERITY', 'info', 'info', 'Info'],
    ['NOTIFICATION_MIN_SEVERITY', 'warning', 'warning', 'Warning'],
    ['NOTIFICATION_MIN_SEVERITY', 'error', 'error', 'Error'],
    ['NOTIFICATION_MIN_SEVERITY', 'critical', 'critical', 'Critical'],
    ['LOG_LEVEL', 'DEBUG', undefined, 'Debug'],
    ['LOG_LEVEL', 'INFO', undefined, 'Info'],
    ['LOG_LEVEL', 'WARNING', undefined, 'Warning'],
    ['LOG_LEVEL', 'ERROR', undefined, 'Error'],
    ['LOG_LEVEL', 'CRITICAL', undefined, 'Critical'],
    ['LLM_PROMPT_CACHE_DIAGNOSTICS_LEVEL', 'off', undefined, 'Off'],
    ['LLM_PROMPT_CACHE_DIAGNOSTICS_LEVEL', 'basic', undefined, 'Basic'],
    ['LLM_PROMPT_CACHE_DIAGNOSTICS_LEVEL', 'debug', undefined, 'Debug'],
    ['MARKET_REVIEW_COLOR_SCHEME', 'green_up', 'Green Up / Red Down', 'Green up / red down'],
    ['MARKET_REVIEW_COLOR_SCHEME', 'red_up', 'Red Up / Green Down', 'Red up / green down'],
    ['GENERATION_BACKEND', 'litellm', undefined, 'Default model settings'],
    ['GENERATION_FALLBACK_BACKEND', 'litellm', undefined, 'Default model settings'],
    ['AGENT_GENERATION_BACKEND', 'auto', 'Auto', 'Auto'],
    ['AGENT_GENERATION_BACKEND', 'litellm', undefined, 'Default model settings'],
    ['AGENT_ARCH', 'single', 'Single Agent', 'Single Agent'],
    ['AGENT_ARCH', 'multi', 'Multi Agent (Orchestrator)', 'Multi Agent (orchestrator)'],
    ['AGENT_ORCHESTRATOR_MODE', 'quick', 'Quick', 'Quick'],
    ['AGENT_ORCHESTRATOR_MODE', 'standard', 'Standard', 'Standard'],
    ['AGENT_ORCHESTRATOR_MODE', 'full', 'Full', 'Full'],
    ['AGENT_ORCHESTRATOR_MODE', 'specialist', 'Specialist', 'Specialist'],
    ['AGENT_SKILL_ROUTING', 'auto', 'Auto (Regime-based)', 'Auto (regime-based)'],
    ['AGENT_SKILL_ROUTING', 'manual', 'Manual (Use AGENT_SKILLS)', 'Manual (use AGENT_SKILLS)'],
  ] as const;

  it('localizes all select options currently exposed by system config schema', () => {
    realSelectOptionCases.forEach(([key, value, fallbackLabel, expectedLabel]) => {
      const label = getFieldOptionLabel(key, value, fallbackLabel);

      expect(label).toBe(expectedLabel);
      expect(label).not.toBe(value);
    });
  });

  it('treats free-text config keys as passthrough for option labels', () => {
    expect(getFieldOptionLabel('MARKET_REVIEW_REGION', 'cn')).toBe('cn');
    expect(getFieldOptionLabel('MARKET_REVIEW_REGION', 'cn,us,jp,kr')).toBe('cn,us,jp,kr');
  });
});

describe('SAVE_CONTEXT_SNAPSHOT settings help contract', () => {
  it('describes the persistence boundary without implying old records are changed', () => {
    const help = getSettingsHelpContent('settings.system.SAVE_CONTEXT_SNAPSHOT', undefined);
    const text = [
      help?.summary,
      help?.usage,
      ...(help?.valueNotes ?? []),
      ...(help?.impact ?? []),
      ...(help?.notes ?? []),
    ].join('\n');

    expect(text).toContain('new history records');
    expect(text).toContain('does not disable AnalysisContextPack construction');
    expect(text).toContain('does not remove the low-sensitivity pack summary');
    expect(text).not.toContain('old records');
  });
});

describe('generation backend settings help contract', () => {
  it('uses user-facing generation channel copy instead of implementation terms', () => {
    const inlineText = [
      getFieldTitle('GENERATION_BACKEND', ''),
      getFieldDescription('GENERATION_BACKEND', ''),
      getFieldTitle('GENERATION_FALLBACK_BACKEND', ''),
      getFieldDescription('GENERATION_FALLBACK_BACKEND', ''),
      getFieldTitle('GENERATION_BACKEND_TIMEOUT_SECONDS', ''),
      getFieldDescription('GENERATION_BACKEND_TIMEOUT_SECONDS', ''),
      getFieldTitle('GENERATION_BACKEND_MAX_OUTPUT_BYTES', ''),
      getFieldDescription('GENERATION_BACKEND_MAX_OUTPUT_BYTES', ''),
      getFieldTitle('GENERATION_BACKEND_MAX_CONCURRENCY', ''),
      getFieldDescription('GENERATION_BACKEND_MAX_CONCURRENCY', ''),
      getFieldTitle('LOCAL_CLI_BACKEND_MAX_CONCURRENCY', ''),
      getFieldDescription('LOCAL_CLI_BACKEND_MAX_CONCURRENCY', ''),
      getFieldTitle('AGENT_GENERATION_BACKEND', ''),
      getFieldDescription('AGENT_GENERATION_BACKEND', ''),
    ].join('\n');
    const backend = getSettingsHelpContent('settings.ai_model.GENERATION_BACKEND', undefined);
    const fallback = getSettingsHelpContent('settings.ai_model.GENERATION_FALLBACK_BACKEND', undefined);
    const agent = getSettingsHelpContent('settings.agent.AGENT_GENERATION_BACKEND', undefined);
    const text = [
      backend?.title,
      backend?.summary,
      backend?.usage,
      ...(backend?.valueNotes ?? []),
      ...(backend?.impact ?? []),
      ...(backend?.notes ?? []),
      fallback?.title,
      fallback?.summary,
      fallback?.usage,
      ...(fallback?.valueNotes ?? []),
      ...(fallback?.impact ?? []),
      ...(fallback?.notes ?? []),
      agent?.title,
      agent?.summary,
      agent?.usage,
      ...(agent?.valueNotes ?? []),
      ...(agent?.impact ?? []),
      ...(agent?.notes ?? []),
    ].join('\n');

    expect(backend?.title).toBe('Analysis Generation Method');
    expect(fallback?.title).toBe('Fallback Generation Method');
    expect(agent?.title).toBe('Ask-Stock Generation Method');
    expect(getFieldTitle('GENERATION_BACKEND_TIMEOUT_SECONDS', '')).toBe('Generation timeout (seconds)');
    expect(getFieldTitle('GENERATION_BACKEND_MAX_OUTPUT_BYTES', '')).toBe('Max output size (bytes)');
    expect(getFieldTitle('GENERATION_BACKEND_MAX_CONCURRENCY', '')).toBe('Model generation max concurrency');
    expect(getFieldTitle('LOCAL_CLI_BACKEND_MAX_CONCURRENCY', '')).toBe('Local CLI max concurrency');
    expect(backend?.showFieldKey).toBe(false);
    expect(fallback?.showFieldKey).toBe(false);
    expect(agent?.showFieldKey).toBe(false);
    expect(backend?.examples).toEqual([]);
    expect(fallback?.examples).toEqual([]);
    expect(agent?.examples).toEqual([]);
    expect(inlineText).toContain('stock analysis');
    expect(inlineText).toContain('Q&A assistant');
    expect(inlineText).toContain('currently available backend');
    expect(inlineText).not.toContain('use the currently available model channel');
    expect(text).toContain('stock analysis');
    expect(text).toContain('market review');
    expect(text).toContain('Auto');
    expect(backend?.usage).toContain('Default model settings');
    expect(fallback?.usage).toContain('Default model settings');
    expect(agent?.usage).toContain('currently available method');
    expect(agent?.valueNotes).toContain('If you are unsure, choose Auto.');
    expect(text).not.toContain('prefer the currently available');
    expect(text).not.toContain('unsupported_tool_calling');
    expect(text).not.toContain('run_agent_loop');
    [
      'backend-level',
      'self fallback',
      'stdout',
      'stderr',
      'contract',
      'MAX_WORKERS',
      'Router',
      'diagnostics',
      'executable',
      'coding-agent',
      'experimental/limited',
      'fail-fast',
      'LiteLLM',
    ].forEach((term) => {
      expect(inlineText).not.toContain(term);
      expect(text).not.toContain(term);
    });

    expect(text).toContain('stock analysis');
    expect(text).toContain('market reviews');
    expect(backend?.usage).toContain('Default model settings');
    expect(fallback?.usage).toContain('Default model settings');
    expect(agent?.usage).toContain('currently available method');
    expect(agent?.valueNotes).toContain('If you are unsure, choose Auto.');
    expect(backend?.notes?.join('\n')).toContain('Default model settings continue');
    expect(backend?.notes?.join('\n')).not.toContain('Advanced note');
    expect(backend?.notes?.join('\n')).not.toContain('LiteLLM');
    expect(text).not.toContain('current available model channel');
    expect(text).not.toContain('unsupported_tool_calling');
    expect(text).not.toContain('run_agent_loop');
  });
});

describe('generation backend status panel i18n contract', () => {
  it('keeps the new status panel copy localized', () => {
    expect(UI_TEXT['settings.generationBackendStatus']).toBe('Generation backend status');
    expect(UI_TEXT['settings.generationBackendSmokeTest']).toBe('JSON smoke test');
    expect(UI_TEXT['settings.generationBackendPrimary']).toBe('Primary backend');
    expect(UI_TEXT['settings.generationBackendFallback']).toBe('Fallback backend');
    expect(UI_TEXT['settings.generationBackendGenerationOnly']).toBe('Generation only');
  });
});

describe('decision signal settings guard', () => {
  it('does not add placeholder DecisionSignal setting translations without a real schema field', () => {
    const placeholderKeys = [
      'DECISION_SIGNAL_ENABLED',
      'DECISION_SIGNALS_ENABLED',
      'DECISION_SIGNAL_WRITE_ENABLED',
      'DECISION_SIGNAL_EXTRACT_ENABLED',
    ];

    placeholderKeys.forEach((key) => {
      expect(getFieldTitle(key, key)).toBe(key);
      expect(getFieldDescription(key, 'schema fallback description')).toBe('schema fallback description');
    });
  });
});
