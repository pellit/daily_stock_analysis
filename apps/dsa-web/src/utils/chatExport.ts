import type { Message } from '../stores/agentChatStore';
import type { UiLanguage } from '../i18n/uiText';

const DATE_FORMAT_OPTIONS = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
} as const;

const CHAT_EXPORT_LOCALE: Record<UiLanguage, string> = {
  zh: 'zh-CN',
  en: 'en-US',
};

const HEADING: Record<UiLanguage, { title: string; user: string; assistant: string; generatedAt: string }> = {
  zh: { title: '问股会话', user: '## 用户', assistant: '## AI', generatedAt: '生成时间' },
  en: { title: 'Ask session', user: '## User', assistant: '## AI', generatedAt: 'Generated at' },
};

const FILENAME_PREFIX: Record<UiLanguage, string> = {
  zh: '问股会话',
  en: 'ask_session',
};

/**
 * Format chat messages as Markdown for export.
 */
export function formatSessionAsMarkdown(
  messages: Message[],
  language: UiLanguage = 'en',
): string {
  const now = new Date();
  const timeStr = now.toLocaleString(CHAT_EXPORT_LOCALE[language], DATE_FORMAT_OPTIONS);
  const labels = HEADING[language];

  const lines: string[] = [
    `# ${labels.title}`,
    '',
    `${labels.generatedAt}: ${timeStr}`,
    '',
  ];

  for (const msg of messages) {
    const heading = msg.role === 'user' ? labels.user : labels.assistant;
    if (msg.role === 'assistant' && msg.skillName) {
      lines.push(`${heading} (${msg.skillName})`);
    } else {
      lines.push(heading);
    }
    lines.push('');
    lines.push(msg.content);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Trigger browser download of session as .md file.
 * Revokes object URL after download to prevent memory leak.
 */
export function downloadSession(
  messages: Message[],
  language: UiLanguage = 'en',
): void {
  const content = formatSessionAsMarkdown(messages, language);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeStr = pad(now.getHours()) + pad(now.getMinutes());
  const filename = `${FILENAME_PREFIX[language]}_${dateStr}_${timeStr}.md`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
