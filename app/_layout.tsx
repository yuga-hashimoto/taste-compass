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
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    LogBox.ignoreAllLogs(true);
    const init = async () => {
      await initI18n();        // ← i18n初期化（デバイス言語検出）
      await initializeStore();
      setIsReady(true);
    };
    init();
  }, [initializeStore]);

  useEffect(() => {
    if (isReady && anonymousUserId) {
      // アプリ起動イベントのトラッキング
      trackEvent(anonymousUserId, 'app_open');
    }
  }, [isReady, anonymousUserId]);

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
        /* プレミアムなホバー・タップマイクロインタラクション */
        [role="button"], button, a {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease !important;
        }
        [role="button"]:hover, button:hover, a:hover {
          transform: scale(1.03);
          opacity: 0.95;
        }
        [role="button"]:active, button:active, a:active {
          transform: scale(0.97);
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: THEME.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: THEME.colors.primary, borderTopColor: 'transparent' }} />
      </View>
    );
  }

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
            options={{ title: t.nav.diagnosis, headerLeft: () => null }}
          />
          <Stack.Screen
            name="result/[sessionId]"
            options={{ title: t.result.title, headerLeft: () => null }}
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
