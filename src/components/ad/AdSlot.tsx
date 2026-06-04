// AdSlot.tsx - 広告表示およびアプリプロモーションコンポーネント
import React from 'react';
import { StyleSheet, Text, View, Platform, Pressable } from 'react-native';
import { ENV } from '../../lib/env';
import { THEME } from '../../theme/theme';
import { getCurrentLang } from '../../i18n';
import { Ionicons } from '@expo/vector-icons';

interface AdSlotProps {
  placement: 'home_bottom' | 'result_bottom' | 'history_bottom' | 'stats_bottom';
}

const PROMO_TEXTS: Record<string, { title: string; desc: string }> = {
  ja: {
    title: 'Taste Compass アプリ版が登場！',
    desc: 'アプリ版なら、広告なしでサクサク診断、無制限の履歴保存、さらに詳細な好みの分析機能が利用できます。',
  },
  en: {
    title: 'Get Taste Compass App!',
    desc: 'Enjoy ad-free diagnosis, unlimited history storage, and deeper taste analysis with our official app.',
  },
  ko: {
    title: 'Taste Compass 앱 출시!',
    desc: '공식 앱을 통해 광고 없는 진단, 무제한 기록 저장, 더 깊이 있는 취향 분석을 즐겨보세요.',
  },
};

export const AdSlot: React.FC<AdSlotProps> = ({ placement }) => {
  // Web環境（SNS拡散・アプリ誘導重視）
  if (Platform.OS === 'web') {
    const lang = getCurrentLang();
    const promo = PROMO_TEXTS[lang] || PROMO_TEXTS['en'];

    // 外部リンクをブラウザで開く処理
    const handleOpenStore = (url: string) => {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    };

    return (
      <View style={styles.webContainer} testID={`app-promo-${placement}`}>
        <View style={styles.promoCard}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>RECOMMENDED</Text>
          </View>
          <Text style={styles.promoTitle}>{promo.title}</Text>
          <Text style={styles.promoDesc}>{promo.desc}</Text>

          <View style={styles.storeButtonsRow}>
            {/* App Store ボタン */}
            <Pressable
              style={({ pressed }) => [styles.storeBtn, pressed && styles.pressed]}
              onPress={() => handleOpenStore('https://apps.apple.com')}
              accessibilityLabel="Download on the App Store"
              accessibilityRole="button"
            >
              <Ionicons name="logo-apple" size={18} color="#fff" style={styles.storeIcon} />
              <View style={styles.storeBtnTextCol}>
                <Text style={styles.storeBtnSub}>Download on the</Text>
                <Text style={styles.storeBtnTitle}>App Store</Text>
              </View>
            </Pressable>

            {/* Google Play ボタン */}
            <Pressable
              style={({ pressed }) => [styles.storeBtn, pressed && styles.pressed]}
              onPress={() => handleOpenStore('https://play.google.com')}
              accessibilityLabel="Get it on Google Play"
              accessibilityRole="button"
            >
              <Ionicons
                name="logo-google-playstore"
                size={16}
                color="#fff"
                style={styles.storeIcon}
              />
              <View style={styles.storeBtnTextCol}>
                <Text style={styles.storeBtnSub}>GET IT ON</Text>
                <Text style={styles.storeBtnTitle}>Google Play</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // 広告機能が無効化されているネイティブ環境では表示しない
  if (!ENV.ENABLE_ADS) {
    return null;
  }

  // ネイティブ (iOS / Android) 用 (将来的な AdMob のプレースホルダー)
  return (
    <View style={styles.container} testID={`ad-slot-${placement}`}>
      <View style={styles.adFrame}>
        <Text style={styles.adLabel}>SPONSOR AD (AdMob)</Text>
        <Text style={styles.adSub}>将来的にここにGoogle AdMobバナーが配信されます</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ネイティブ広告用
  container: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adFrame: {
    width: '100%',
    maxWidth: 320,
    height: 100,
    backgroundColor: 'rgba(26, 20, 36, 0.4)',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderStyle: 'dashed',
  },
  adLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: THEME.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  adSub: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 12,
  },

  // Webプロモーション用
  webContainer: {
    width: '100%',
    maxWidth: 480,
    paddingVertical: 16,
    alignItems: 'center',
  },
  promoCard: {
    width: '100%',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.lg,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    ...THEME.shadow,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.full,
    backgroundColor: 'rgba(175,82,57,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(175,82,57,0.15)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.text,
    textAlign: 'center',
  },
  promoDesc: {
    fontSize: 12,
    color: THEME.colors.textSub,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  storeButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    width: '100%',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  storeIcon: {
    marginRight: 6,
  },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 140,
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  storeBtnTextCol: {
    alignItems: 'flex-start',
  },
  storeBtnSub: {
    fontSize: 8,
    color: '#A0A0A0',
    fontWeight: '500',
    lineHeight: 9,
  },
  storeBtnTitle: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.8,
  },
});
