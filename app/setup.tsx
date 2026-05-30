// setup.tsx - 診断設定画面（モダンリデザイン版）
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, Pressable, ScrollView, Platform, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDiagnosisStore } from '../src/stores/useDiagnosisStore';
import { THEME } from '../src/theme/theme';
import { trackEvent } from '../src/services/eventService';
import { useI18n } from '../src/i18n';

const CARD_COUNTS = [
  { value: 30, label: '30', recommended: true },
  { value: 50, label: '50', recommended: false },
  { value: 100, label: '100', recommended: false },
];

const THEME_IDS = ['all', 'natural', 'cool', 'cute', 'sexy', 'korean', 'global', 'mature', 'casual'] as const;

export default function SetupScreen() {
  const router = useRouter();
  const startSession = useDiagnosisStore((s) => s.startSession);
  const anonymousUserId = useDiagnosisStore((s) => s.anonymousUserId);
  const { t, i } = useI18n();

  const [selectedCount, setSelectedCount] = useState(30);
  const [selectedTheme, setSelectedTheme] = useState<typeof THEME_IDS[number]>('all');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleStart = () => {
    const sessionId = startSession(selectedTheme, selectedCount);
    trackEvent(anonymousUserId, 'diagnosis_start', {
      session_id: sessionId,
      theme: selectedTheme,
      total_images: selectedCount,
    });
    router.replace('/diagnosis');
  };

  // 翻訳済みテーマリスト
  const themes = THEME_IDS.map((id) => ({
    id,
    ...t.setup.themes[id],
  }));

  const activeTheme = themes.find((th) => th.id === selectedTheme);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.bgBlob} pointerEvents="none" />

      {/* ─── ヘッダー ─── */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.stepLabel}>{t.setup.stepLabel}</Text>
        <Text style={styles.pageTitle}>{t.setup.pageTitle}</Text>
        <Text style={styles.pageSub}>{t.setup.pageSub}</Text>
      </Animated.View>

      {/* ─── 枚数選択 ─── */}
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <Text style={styles.sectionLabel}>{t.setup.countSection}</Text>
        <View style={styles.countRow}>
          {CARD_COUNTS.map((c) => {
            const active = selectedCount === c.value;
            const sublabels = [t.setup.approx5min, t.setup.approx8min, t.setup.approx15min];
            const subLabel = sublabels[CARD_COUNTS.indexOf(c)] ?? '';
            return (
              <Pressable
                key={c.value}
                style={({ pressed }) => [
                  styles.countCard,
                  active && styles.countCardActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => setSelectedCount(c.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
              >
                {c.recommended && (
                  <View style={styles.recBadge}>
                    <Text style={styles.recBadgeText}>{t.setup.recommended}</Text>
                  </View>
                )}
                <Text style={[styles.countNumber, active && styles.countNumberActive]}>
                  {c.value}
                </Text>
                <Text style={[styles.countSub, active && styles.countSubActive]}>
                  {subLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* ─── テーマ選択 ─── */}
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <Text style={styles.sectionLabel}>{t.setup.themeSection}</Text>
        <View style={styles.themeGrid}>
          {themes.map((th) => {
            const active = selectedTheme === th.id;
            return (
              <Pressable
                key={th.id}
                style={({ pressed }) => [
                  styles.themeChip,
                  active && styles.themeChipActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => setSelectedTheme(th.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
              >
                <Text style={styles.themeEmoji}>{th.emoji}</Text>
                <Text style={[styles.themeLabel, active && styles.themeLabelActive]}>
                  {th.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 選択中テーマの説明 */}
        <View style={styles.themeDescBox}>
          <Text style={styles.themeDescText}>{activeTheme?.desc ?? ''}</Text>
        </View>
      </Animated.View>

      {/* ─── スタートボタン ─── */}
      <Animated.View style={[styles.startArea, { opacity: fadeAnim }]}>
        <Pressable
          style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
          onPress={handleStart}
          accessibilityLabel={t.setup.startBtn}
          accessibilityRole="button"
        >
          <Text style={styles.startBtnText}>
            {i(t.setup.startBtn, { count: selectedCount, theme: activeTheme?.label ?? '' })}
          </Text>
          <Text style={styles.startArrow}>→</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: THEME.colors.background,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 48,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  bgBlob: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(192,132,252,0.05)',
    ...Platform.select({ web: { filter: 'blur(60px)' } }),
  },

  // ─── ヘッダー ───
  header: {
    width: '100%',
    maxWidth: 480,
    marginBottom: 32,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  pageSub: {
    fontSize: 13,
    color: THEME.colors.textSub,
  },

  // ─── セクション ───
  section: {
    width: '100%',
    maxWidth: 480,
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSub,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // ─── 枚数 ───
  countRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countCard: {
    flex: 1,
    height: 72,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    gap: 4,
    ...Platform.select({ web: { cursor: 'pointer', transition: 'all 0.15s ease' } }),
  },
  countCardActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(255,77,109,0.06)',
    ...Platform.select({
      web: { boxShadow: '0 0 0 1px rgba(255,77,109,0.4)' },
    }),
  },
  recBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  countNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textSub,
  },
  countNumberActive: { color: THEME.colors.primary },
  countSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  countSubActive: { color: 'rgba(255,77,109,0.7)' },

  // ─── テーマ ───
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...Platform.select({ web: { cursor: 'pointer', transition: 'all 0.12s ease' } }),
  },
  themeChipActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(255,77,109,0.08)',
    ...Platform.select({
      web: { boxShadow: '0 0 0 1px rgba(255,77,109,0.3)' },
    }),
  },
  themeEmoji: { fontSize: 14 },
  themeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSub,
  },
  themeLabelActive: { color: THEME.colors.primary },

  themeDescBox: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  themeDescText: {
    fontSize: 12,
    color: THEME.colors.textSub,
    lineHeight: 18,
  },

  // ─── スタート ───
  startArea: {
    width: '100%',
    maxWidth: 480,
    marginTop: 8,
  },
  startBtn: {
    width: '100%',
    height: 58,
    borderRadius: THEME.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #FF4D6D 0%, #FF8C42 100%)',
        cursor: 'pointer',
        transition: 'opacity 0.15s ease',
        boxShadow: '0 0 24px rgba(255,77,109,0.3)',
      },
      default: { backgroundColor: THEME.colors.primary },
    }),
  },
  startBtnPressed: { opacity: 0.85 },
  startBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  startArrow: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },

  pressed: { opacity: 0.75 },
});
