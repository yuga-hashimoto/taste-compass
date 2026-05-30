// src/i18n/index.ts
// i18nエンジン: デバイス言語検出・手動切替・テンプレート補間

import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { ja, TranslationKeys } from './locales/ja';
import { en }   from './locales/en';
import { ko }   from './locales/ko';
import { zhCN } from './locales/zh-CN';
import { zhTW } from './locales/zh-TW';
import { es }   from './locales/es';
import { pt }   from './locales/pt';
import { fr }   from './locales/fr';
import { de }   from './locales/de';
import { id }   from './locales/id';
import { th }   from './locales/th';
import { vi }   from './locales/vi';
import { ar }   from './locales/ar';
import { hi }   from './locales/hi';

// ── サポート言語マップ ───────────────────────────────────
export const LOCALES: Record<string, TranslationKeys> = {
  ja, en, ko,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  es, pt, fr, de, id, th, vi, ar, hi,
};

export const SUPPORTED_LANGS = Object.keys(LOCALES);

// RTL言語
export const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur']);

// ── ストレージキー ────────────────────────────────────────
const LANG_STORAGE_KEY = 'taste_compass_language';

// ── デバイス言語 → サポート言語コードへのマッピング ──────────
function detectDeviceLang(): string {
  try {
    const locales = getLocales();
    if (!locales || locales.length === 0) return 'en';

    for (const locale of locales) {
      const lang = locale.languageCode ?? '';
      const region = locale.regionCode ?? '';
      const full = `${lang}-${region}`;

      // 繁体字優先チェック
      if (lang === 'zh' && (region === 'TW' || region === 'HK' || region === 'MO')) {
        return 'zh-TW';
      }
      if (lang === 'zh') return 'zh-CN';

      if (SUPPORTED_LANGS.includes(full)) return full;
      if (SUPPORTED_LANGS.includes(lang)) return lang;
    }
  } catch {}
  return 'en';
}

// ── グローバルstate (シンプルな購読型) ──────────────────────
let _currentLang: string = 'en';
let _initialized = false;
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((fn) => fn());
}

// ── 初期化 ────────────────────────────────────────────────
export async function initI18n(): Promise<void> {
  if (_initialized) return;
  _initialized = true;
  try {
    const saved = await AsyncStorage.getItem(LANG_STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      _currentLang = saved;
    } else {
      _currentLang = detectDeviceLang();
    }
  } catch {
    _currentLang = detectDeviceLang();
  }
  notify();
}

// ── 言語切替 ────────────────────────────────────────────────
export async function setLanguage(lang: string): Promise<void> {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  _currentLang = lang;
  try {
    await AsyncStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {}
  notify();
}

// ── 現在の翻訳取得 ────────────────────────────────────────
export function getT(): TranslationKeys {
  return LOCALES[_currentLang] ?? LOCALES['en'];
}

export function getCurrentLang(): string {
  return _currentLang;
}

export function isRTL(): boolean {
  return RTL_LANGS.has(_currentLang);
}

// ── テンプレート補間 ──────────────────────────────────────
// 使用例: interpolate('{{count}}枚 · {{theme}} で診断', { count: 30, theme: 'ナチュラル系' })
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`
  );
}

// ── React Hook ────────────────────────────────────────────
export function useI18n() {
  const [lang, setLang] = useState(_currentLang);

  useEffect(() => {
    const update = () => setLang(_currentLang);
    _listeners.add(update);
    // 初期化されていない場合は初期化を起動
    if (!_initialized) {
      initI18n().then(update);
    }
    return () => {
      _listeners.delete(update);
    };
  }, []);

  const t = LOCALES[lang] ?? LOCALES['en'];

  const changeLanguage = useCallback(async (newLang: string) => {
    await setLanguage(newLang);
  }, []);

  return {
    t,
    lang,
    changeLanguage,
    isRTL: RTL_LANGS.has(lang),
    allLangs: SUPPORTED_LANGS.map((code) => ({
      code,
      name: LOCALES[code].lang.name,
      flag: LOCALES[code].lang.flag,
    })),
    /** テンプレート補間ヘルパー */
    i: interpolate,
  };
}
