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
    // 1. Webブラウザ環境での言語検出を優先
    if (typeof navigator !== 'undefined') {
      const navLangs = navigator.languages || [navigator.language];
      for (const rawLang of navLangs) {
        if (!rawLang) continue;
        const normalized = rawLang.toLowerCase();

        // 繁体字優先チェック
        if (
          normalized.startsWith('zh-tw') ||
          normalized.startsWith('zh-hk') ||
          normalized.startsWith('zh-mo')
        ) {
          return 'zh-TW';
        }
        if (normalized.startsWith('zh')) {
          return 'zh-CN';
        }

        const short = normalized.split('-')[0];
        if (SUPPORTED_LANGS.includes(normalized)) return normalized;
        if (SUPPORTED_LANGS.includes(short)) return short;
      }
    }

    // 2. React Nativeネイティブ環境でのフォールバック
    const locales = getLocales();
    if (locales && locales.length > 0) {
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

// ── URL言語パラメータ同期 (Web環境用ヘルパー) ────────────────
function syncUrlLang(lang: string) {
  if (typeof window !== 'undefined' && window.history && window.location) {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('lang') === lang) return;
      url.searchParams.set('lang', lang);
      window.history.replaceState(null, '', url.toString());
    } catch (e) {
      console.warn('[i18n] Failed to sync lang parameter to URL:', e);
    }
  }
}

// ── Web環境における履歴操作(popstate)の監視 ────────────────────
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('popstate', () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const qLang = params.get('lang');
      if (qLang && SUPPORTED_LANGS.includes(qLang) && qLang !== _currentLang) {
        _currentLang = qLang;
        notify();
      }
    } catch {}
  });
}

// ── 初期化 ────────────────────────────────────────────────
export async function initI18n(): Promise<void> {
  if (_initialized) return;
  _initialized = true;
  try {
    let langToUse: string | null = null;

    // 1. URLパラメータから言語を取得 (最優先)
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const qLang = params.get('lang');
      if (qLang && SUPPORTED_LANGS.includes(qLang)) {
        langToUse = qLang;
      }
    }

    // 2. URLになければ AsyncStorage から取得
    if (!langToUse) {
      const saved = await AsyncStorage.getItem(LANG_STORAGE_KEY);
      if (saved && SUPPORTED_LANGS.includes(saved)) {
        langToUse = saved;
      }
    }

    // 3. それでもなければデバイス言語を検出
    if (!langToUse) {
      langToUse = detectDeviceLang();
    }

    _currentLang = langToUse;

    // ストレージに保存し、URLと同期
    await AsyncStorage.setItem(LANG_STORAGE_KEY, langToUse);
    syncUrlLang(langToUse);
  } catch {
    _currentLang = detectDeviceLang();
    syncUrlLang(_currentLang);
  }
  notify();
}

// ── 言語切替 ────────────────────────────────────────────────
export async function setLanguage(lang: string): Promise<void> {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  _currentLang = lang;
  try {
    await AsyncStorage.setItem(LANG_STORAGE_KEY, lang);
    syncUrlLang(lang);
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
