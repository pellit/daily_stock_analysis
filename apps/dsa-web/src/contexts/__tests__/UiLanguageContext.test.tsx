import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  UiLanguageProvider,
  useUiLanguage,
} from '../UiLanguageContext';
import { translateUiText } from '../../utils/uiLanguage';

function TranslationProbe() {
  const { t } = useUiLanguage();
  return (
    <div>
      <span data-testid="literal">{t('common.cancel')}</span>
      <span data-testid="placeholder">{t('common.selectedCount', { count: 2 })}</span>
    </div>
  );
}

describe('UiLanguageContext', () => {
  it('returns English UI text by default regardless of storage', () => {
    localStorage.setItem('dsa.uiLanguage', 'zh');

    render(
      <UiLanguageProvider>
        <TranslationProbe />
      </UiLanguageProvider>
    );

    expect(screen.getByTestId('literal').textContent).toBe('Cancel');
    expect(screen.getByTestId('placeholder').textContent).toBe('2 selected');
  });

  it('exposes a stable translateUiText helper for non-React callers', () => {
    expect(translateUiText('common.confirm')).toBe('OK');
    expect(translateUiText('common.selectedCount', { count: 5 })).toBe('5 selected');
  });
});
