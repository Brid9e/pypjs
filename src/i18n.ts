/**
 * Internationalization (i18n) translations
 * Multi-language support for payment panel component
 * @author Brid9e
 */

import { I18nTexts } from './types'
import { zh } from './locale/zh'
import { en } from './locale/en'
import { ja } from './locale/ja'
import { ru } from './locale/ru'

export type Language = 'zh' | 'en' | 'ja' | 'ru'

export type { I18nTexts }

export const i18nTexts: Record<Language, I18nTexts> = {
  zh,
  en,
  ja,
  ru
}

/**
 * Get i18n texts for a specific language
 * @param {Language} lang - Language code
 * @param {Partial<I18nTexts>} [customI18n] - Custom i18n texts to override defaults
 * @returns {I18nTexts} I18n texts object with custom overrides applied
 */
export function getI18nTexts(lang: Language = 'en', customI18n?: Partial<I18nTexts>): I18nTexts {
  const baseTexts = i18nTexts[lang] || i18nTexts.en
  if (customI18n) {
    return { ...baseTexts, ...customI18n }
  }
  return baseTexts
}
