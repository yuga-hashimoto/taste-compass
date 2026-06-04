// index.tsx - ホーム画面（モダンリデザイン + i18n対応版）
import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { THEME } from '../src/theme/theme';
import { AdSlot } from '../src/components/ad/AdSlot';
import { useI18n } from '../src/i18n';
import { Feather } from '@expo/vector-icons';
import { getDiagnosisImages } from '../src/services/imageService';

const { width: SCREEN_W } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();

    // 診断用画像の事前プリロード
    (async () => {
      try {
        const loadedImages = await getDiagnosisImages('all', 30);
        const urls = loadedImages.map((img) => img.image_url);
        Image.prefetch(urls);
      } catch (err) {
        console.warn('Failed to prefetch images on Home:', err);
      }
    })();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── 装飾グロブ ─── */}
      <View style={styles.bgBlob1} pointerEvents="none" />
      <View style={styles.bgBlob2} pointerEvents="none" />

      {/* ─── ヒーロー ─── */}
      <Animated.View
        style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t.home.badge}</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>
          {t.home.title}
          <Text style={styles.heroTitleAccent}>{t.home.titleAccent}</Text>
        </Text>

        <Text style={styles.heroSub}>{t.home.subtitle}</Text>
      </Animated.View>

      {/* ─── CTAボタン ─── */}
      <Animated.View
        style={[
          styles.ctaWrapper,
          { opacity: fadeAnim, transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
          onPress={() => router.push('/setup')}
          accessibilityLabel={t.home.startBtn}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>{t.home.startBtn}</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </Pressable>
      </Animated.View>

      {/* ─── 特徴リスト ─── */}
      <Animated.View style={[styles.featuresRow, { opacity: fadeAnim }]}>
        {[
          { icon: <Feather name="sliders" size={20} color={THEME.colors.primary} />, label: t.home.feature1Label, desc: t.home.feature1Desc },
          { icon: <Feather name="pie-chart" size={20} color={THEME.colors.primary} />, label: t.home.feature2Label, desc: t.home.feature2Desc },
          { icon: <Feather name="users" size={20} color={THEME.colors.primary} />, label: t.home.feature3Label, desc: t.home.feature3Desc },
        ].map((f, i) => (
          <View key={i} style={styles.featureCard}>
            <View style={styles.featureIcon}>{f.icon}</View>
            <Text style={styles.featureLabel}>{f.label}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        ))}
      </Animated.View>

      {/* ─── 免責カード ─── */}
      <Animated.View style={[styles.disclaimerCard, { opacity: fadeAnim }]}>
        <Feather name="alert-triangle" size={14} color={THEME.colors.skip} style={styles.disclaimerIcon} />
        <Text style={styles.disclaimerText}>{t.home.disclaimer}</Text>
      </Animated.View>

      {/* ─── サブアクション ─── */}
      <Animated.View style={[styles.subActions, { opacity: fadeAnim }]}>
        <Pressable
          style={({ pressed }) => [styles.subBtn, pressed && styles.subBtnPressed]}
          onPress={() => router.push('/history')}
        >
          <Feather name="bar-chart-2" size={18} color={THEME.colors.textSub} style={styles.subBtnIcon} />
          <Text style={styles.subBtnText}>{t.home.navHistory}</Text>
        </Pressable>
        <View style={styles.subDivider} />
        <Pressable
          style={({ pressed }) => [styles.subBtn, pressed && styles.subBtnPressed]}
          onPress={() => router.push('/stats')}
        >
          <Feather name="trending-up" size={18} color={THEME.colors.textSub} style={styles.subBtnIcon} />
          <Text style={styles.subBtnText}>{t.home.navStats}</Text>
        </Pressable>
        <View style={styles.subDivider} />
        <Pressable
          style={({ pressed }) => [styles.subBtn, pressed && styles.subBtnPressed]}
          onPress={() => router.push('/settings')}
        >
          <Feather name="settings" size={18} color={THEME.colors.textSub} style={styles.subBtnIcon} />
          <Text style={styles.subBtnText}>{t.home.navSettings}</Text>
        </Pressable>
      </Animated.View>

      {/* ─── フッター ─── */}
      <View style={styles.footer}>
        <View style={styles.footerLinks}>
          {[
            { label: t.home.terms,   path: '/terms' },
            { label: t.home.privacy, path: '/privacy' },
            { label: t.home.contact, path: '/contact' },
          ].map((l, i) => (
            <React.Fragment key={l.path}>
              {i > 0 && <Text style={styles.footerDot}>·</Text>}
              <Pressable onPress={() => router.push(l.path as any)}>
                <Text style={styles.footerLink}>{l.label}</Text>
              </Pressable>
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.copyright}>{t.home.copyright}</Text>
      </View>

      <AdSlot placement="home_bottom" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 40,
    position: 'relative',
    overflow: 'hidden',
  },

  bgBlob1: {
    position: 'absolute',
    top: -100,
    left: -80,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(175,82,57,0.04)',
    ...Platform.select({ web: { filter: 'blur(80px)' } }),
  },
  bgBlob2: {
    position: 'absolute',
    top: 200,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(79,107,88,0.04)',
    ...Platform.select({ web: { filter: 'blur(80px)' } }),
  },

  hero: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    marginBottom: 36,
  },
  badgeRow: { marginBottom: 20 },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: THEME.radius.full,
    backgroundColor: 'rgba(175,82,57,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(175,82,57,0.20)',
  },
  badgeText: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: THEME.colors.text,
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  heroTitleAccent: {
    color: THEME.colors.primary,
    ...Platform.select({ web: {} }),
  },
  heroSub: {
    fontSize: 14,
    color: THEME.colors.textSub,
    textAlign: 'center',
    lineHeight: 22,
  },

  ctaWrapper: {
    width: '100%',
    maxWidth: 340,
    marginBottom: 32,
    ...Platform.select({
      web: { filter: 'drop-shadow(0 0 16px rgba(175,82,57,0.15))' },
    }),
  },
  ctaButton: {
    width: '100%',
    height: 58,
    borderRadius: THEME.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Platform.select({
      web: {
        backgroundColor: THEME.colors.primary,
        cursor: 'pointer',
        transition: 'opacity 0.15s ease',
      },
      default: { backgroundColor: THEME.colors.primary },
    }),
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  ctaArrow: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },

  featuresRow: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 480,
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  featureCard: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  featureIcon: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.text,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },

  disclaimerCard: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(248,113,113,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.12)',
    borderRadius: THEME.radius.md,
    padding: 14,
    marginBottom: 24,
  },
  disclaimerIcon: { fontSize: 14, color: THEME.colors.skip, marginTop: 1 },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: THEME.colors.textSub,
    lineHeight: 16,
  },

  subActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.lg,
    marginBottom: 32,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 340,
  },
  subBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  subBtnPressed: { backgroundColor: THEME.colors.surfaceHigh },
  subBtnIcon: { fontSize: 18 },
  subBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSub,
  },
  subDivider: {
    width: 1,
    height: 32,
    backgroundColor: THEME.colors.border,
  },

  footer: { alignItems: 'center', gap: 8, width: '100%' },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLink: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  footerDot: { fontSize: 11, color: THEME.colors.textMuted, opacity: 0.4 },
  copyright: { fontSize: 10, color: THEME.colors.textMuted, opacity: 0.5 },
});
