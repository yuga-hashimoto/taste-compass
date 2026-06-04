// tests/unit/i18n.test.ts - i18nの多言語自動検出およびURLパラメータ同期のテスト
/* eslint-disable @typescript-eslint/no-require-imports */
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage の Jest モック設定
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn(async (key: string) => store[key] || null),
    setItem: jest.fn(async (key: string, value: string) => {
      store[key] = value;
      return null;
    }),
    removeItem: jest.fn(async (key: string) => {
      delete store[key];
      return null;
    }),
    clear: jest.fn(async () => {
      store = {};
      return null;
    }),
  };
});

describe('i18n tests', () => {
  let originalWindow: any;

  beforeAll(() => {
    originalWindow = global.window;
  });

  afterAll(() => {
    global.window = originalWindow;
  });

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.resetModules();
  });

  it('should prioritize URL parameter over AsyncStorage and device language', async () => {
    const replaceStateMock = jest.fn();
    const mockLocation = {
      href: 'http://localhost:8081/',
      search: '?lang=ko',
    };

    global.window = {
      history: {
        replaceState: replaceStateMock,
      },
      location: mockLocation,
      addEventListener: jest.fn(),
    } as any;

    const dynamicAsyncStorage = require('@react-native-async-storage/async-storage');
    await dynamicAsyncStorage.setItem('taste_compass_language', 'en');

    // 各テストで独立した状態を得るため動的インポート
    const { initI18n: dynamicInit, getCurrentLang: dynamicGetLang } = require('../../src/i18n');

    await dynamicInit();

    // URLパラメータの 'ko' が最優先されること
    expect(dynamicGetLang()).toBe('ko');
    // URL同期が走ること
    expect(replaceStateMock).toHaveBeenCalled();
  });

  it('should fallback to AsyncStorage if URL parameter is missing or invalid', async () => {
    const replaceStateMock = jest.fn();
    const mockLocation = {
      href: 'http://localhost:8081/?lang=invalid',
      search: '?lang=invalid',
    };

    global.window = {
      history: {
        replaceState: replaceStateMock,
      },
      location: mockLocation,
      addEventListener: jest.fn(),
    } as any;

    const dynamicAsyncStorage = require('@react-native-async-storage/async-storage');
    await dynamicAsyncStorage.setItem('taste_compass_language', 'es');

    const { initI18n: dynamicInit, getCurrentLang: dynamicGetLang } = require('../../src/i18n');

    await dynamicInit();

    // 'invalid' はサポート外なので、AsyncStorage の 'es' が適用されること
    expect(dynamicGetLang()).toBe('es');
  });

  it('should sync URL when setLanguage is called', async () => {
    const replaceStateMock = jest.fn();
    const mockLocation = {
      href: 'http://localhost:8081/',
      search: '',
    };

    global.window = {
      history: {
        replaceState: replaceStateMock,
      },
      location: mockLocation,
      addEventListener: jest.fn(),
    } as any;

    const {
      initI18n: dynamicInit,
      setLanguage: dynamicSetLang,
      getCurrentLang: dynamicGetLang,
    } = require('../../src/i18n');

    await dynamicInit();
    replaceStateMock.mockClear();

    await dynamicSetLang('ko');
    expect(dynamicGetLang()).toBe('ko');

    // URLパラメータに ko が設定された replaceState が呼ばれたか確認
    expect(replaceStateMock).toHaveBeenCalled();
    const calledUrl = replaceStateMock.mock.calls[0][2];
    expect(calledUrl).toContain('lang=ko');
  });
});
