// _layout.tsx - 共通レイアウト
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView, Platform, LogBox } from 'react-native';
import { useDiagnosisStore } from '../src/stores/useDiagnosisStore';
import { THEME } from '../src/theme/theme';
import { LAYOUT } from '../src/lib/platform';
import { trackEvent } from '../src/services/eventService';
import { initI18n, useI18n } from '../src/i18n';

export default function RootLayout() {
  const initializeStore = useDiagnosisStore((state) => state.initializeStore);
  const anonymousUserId = useDiagnosisStore((state) => state.anonymousUserId);
  const { t } = useI18n();

  useEffect(() => {
    LogBox.ignoreAllLogs(true);
    const init = async () => {
      await initI18n();        // ← i18n初期化（デバイス言語検出）
      await initializeStore();
    };
    init();
  }, [initializeStore]);

  useEffect(() => {
    if (anonymousUserId) {
      // アプリ起動イベントのトラッキング
      trackEvent(anonymousUserId, 'app_open');
    }
  }, [anonymousUserId]);

  // Webブラウザで動作している場合、プレミアムなフォントやリセットスタイルをインジェクションする
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Google Fonts (Inter & Outfit) の動的ロード
      const link = document.createElement('link');
      link.href =
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@400;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // グローバルスタイルの調整
      const style = document.createElement('style');
      style.textContent = `
        body {
          background-color: ${THEME.colors.background} !important;
          margin: 0;
          font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow-x: hidden;
        }
        /* スクリプトやボタンのフォーカスリング等を綺麗にする */
        button, a, input, select {
          outline: none;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.responsiveWrapper}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: THEME.colors.surface,
            },
            headerTintColor: THEME.colors.text,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontFamily: Platform.OS === 'web' ? 'Outfit' : 'System',
            },
            contentStyle: {
              backgroundColor: THEME.colors.background,
            },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="setup" options={{ title: t.setup.pageTitle }} />
          <Stack.Screen
            name="diagnosis"
            options={{ title: t.nav.home, headerLeft: () => null }}
          />
          <Stack.Screen
            name="result/[sessionId]"
            options={{ title: t.common.home, headerLeft: () => null }}
          />
          <Stack.Screen name="history" options={{ title: t.nav.history }} />
          <Stack.Screen name="stats" options={{ title: t.nav.stats }} />
          <Stack.Screen name="settings" options={{ title: t.settings.title }} />
          <Stack.Screen name="terms" options={{ title: t.home.terms }} />
          <Stack.Screen name="privacy" options={{ title: t.home.privacy }} />
          <Stack.Screen name="contact" options={{ title: t.home.contact }} />
        </Stack>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responsiveWrapper: {
    flex: 1,
    width: '100%',
    // PCブラウザ等の横幅が広い環境では、スマホ幅のモックとして表示することで操作性を最大化
    maxWidth: LAYOUT.isTablet ? LAYOUT.maxContentWidth : '100%',
    backgroundColor: THEME.colors.background,
    alignSelf: 'center',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: LAYOUT.isTablet ? '0 0 40px rgba(232,36,90,0.10)' : 'none',
      },
    }),
  },
});
