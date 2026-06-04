// result/[sessionId].tsx - 診断結果画面（モダンリデザイン版）
// 世間スコア・国別比較・体型傾向・レアリティ・メーターを全表示
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  StyleSheet, Text, View, Pressable, ScrollView,
  Platform, Share, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useDiagnosisStore } from '../../src/stores/useDiagnosisStore';
import { THEME } from '../../src/theme/theme';
import { getDiagnosisResultBySession } from '../../src/services/resultService';
import { AdSlot } from '../../src/components/ad/AdSlot';
import { trackEvent } from '../../src/services/eventService';
import { useI18n } from '../../src/i18n';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ThemeIcon } from '../../src/components/ui/ThemeIcon';
import { CountryFlag } from '../../src/components/ui/CountryFlag';

// ── メーターコンポーネント ──────────────────────────────
function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value / 100, duration: 1000, useNativeDriver: false }).start();
  }, [value]);

  return (
    <View style={meterStyles.row}>
      <Text style={meterStyles.label}>{label}</Text>
      <View style={meterStyles.track}>
        <Animated.View
          style={[
            meterStyles.fill,
            {
              width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={[meterStyles.value, { color }]}>{value}</Text>
    </View>
  );
}
const meterStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  label: {
    width: 80,
    fontSize: 11,
    color: THEME.colors.textSub,
    fontWeight: '600',
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: THEME.colors.surfaceHigh,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  value: {
    width: 28,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
});

// ── スコアサークル ──────────────────────────────────────
function ScoreCircle({ score, label }: { score: number; label: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    Animated.timing(anim, { toValue: score, duration: 1200, useNativeDriver: false }).start();
    anim.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => anim.removeAllListeners();
  }, [score]);

  const getColor = () => {
    if (score >= 70) return '#3E7B5E';
    if (score >= 40) return THEME.colors.primary;
    return THEME.colors.accent;
  };

  return (
    <View style={circleStyles.wrapper}>
      <View style={[circleStyles.circle, { borderColor: getColor() }]}>
        <Text style={[circleStyles.number, { color: getColor() }]}>{display}</Text>
        <Text style={circleStyles.pct}>%</Text>
        <Text style={circleStyles.label}>{label}</Text>
      </View>
      <View style={[circleStyles.glow, {
        ...Platform.select({ web: { boxShadow: `0 0 40px ${getColor()}40` } })
      }]} />
    </View>
  );
}
const circleStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceHigh,
  },
  number: {
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 48,
  },
  pct: {
    fontSize: 14,
    color: THEME.colors.textSub,
    marginTop: -4,
  },
  label: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.3,
  },
});

// ── 国別バー ────────────────────────────────────────────
function CountryBar({ code, label, score, isTop }: { code: string; label: string; score: number; isTop: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: score / 100, duration: 900, useNativeDriver: false }).start();
  }, [score]);

  return (
    <View style={countryStyles.row}>
      <CountryFlag code={code} size={16} />
      <Text style={countryStyles.label}>{label}</Text>
      <View style={countryStyles.track}>
        <Animated.View
          style={[
            countryStyles.fill,
            {
              width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: isTop ? THEME.colors.primary : THEME.colors.accent,
            },
          ]}
        />
      </View>
      <Text style={[countryStyles.score, isTop && { color: THEME.colors.primary }]}>
        {score}%
      </Text>
    </View>
  );
}
const countryStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  flag: { fontSize: 16, width: 24 },
  label: { width: 60, fontSize: 12, color: THEME.colors.textSub, fontWeight: '600' },
  track: { flex: 1, height: 6, backgroundColor: THEME.colors.surfaceHigh, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  score: { width: 36, fontSize: 12, fontWeight: '700', color: THEME.colors.textSub, textAlign: 'right' },
});

// ── メイン画面 ─────────────────────────────────────────
export default function ResultScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const anonymousUserId = useDiagnosisStore((s) => s.anonymousUserId);
  const { t, lang, changeLanguage, allLangs, i } = useI18n();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const fadeAnim  = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(30), []);

  useEffect(() => {
    (async () => {
      if (!sessionId || !anonymousUserId) return;
      setLoading(true);
      const data = await getDiagnosisResultBySession(sessionId, anonymousUserId);
      setResult(data);
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      ]).start();
    })();
  }, [sessionId, anonymousUserId]);

  const handleShare = async () => {
    if (!result) return;
    trackEvent(anonymousUserId, 'result_share_click', { session_id: sessionId });
    const { preference_type, compatibility_score,
      country_affinity, rarity, summary_json } = result;
    const text = [
      `【好みズレ診断】${preference_type}`,
      `世間との一致度: ${compatibility_score}%`,
      `好みが近い国: ${country_affinity?.top_country_label || ''}`,
      `レア度: ${rarity?.label || ''}`,
      ``,
      summary_json?.style_analysis || '',
      ``,
      `#好みズレ診断 #TasteCompass`,
    ].join('\n');

    if (Platform.OS === 'web') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      try { await Share.share({ message: text }); } catch {}
    }
  };

  // ─── ローディング ───
  if (loading) {
    return (
      <View style={styles.fullCenter}>
        <View style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>{t.result.loading}</Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.fullCenter}>
        <Text style={styles.errorText}>{t.common.resultNotFound}</Text>
        <Pressable style={styles.ghostBtn} onPress={() => router.replace('/')}>
          <Text style={styles.ghostBtnText}>{t.common.backHome}</Text>
        </Pressable>
      </View>
    );
  }

  const {
    compatibility_score, preference_type, preference_type_emoji,
    mainstream_score, uniqueness_score, summary_json,
  } = result;

  // 以前のコードと互換性を保ちつつ、summary_json から拡張データを復元
  const country_affinity = result.country_affinity || summary_json?.country_affinity;
  const body_preference = result.body_preference || summary_json?.body_preference;
  const age_preference = result.age_preference || summary_json?.age_preference;
  const vibe_preference = result.vibe_preference || summary_json?.vibe_preference;
  const rarity = result.rarity || summary_json?.rarity;
  const meters = result.meters || summary_json?.meters;

  const top3Countries = (country_affinity?.rankings || []).slice(0, 5);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── 動的メタデータ（SEO・Webタイトル） ─── */}
      <Stack.Screen
        options={{
          title: result ? `${result.preference_type} | Taste Compass` : '診断結果',
        }}
      />

      <View style={styles.bgBlob} pointerEvents="none" />

      {/* ─── ヒーロー：タイプ名 + スコア ─── */}
      <Animated.View style={[styles.heroCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.typeRow}>
          <ThemeIcon themeId={preference_type_emoji} size={36} color={THEME.colors.primary} />
          <View>
            <Text style={styles.typeCaption}>{t.result.yourType}</Text>
            <Text style={styles.typeName}>{preference_type}</Text>
          </View>
        </View>

        <ScoreCircle score={compatibility_score} label={t.result.compatibilityLabel} />

        {/* 王道 vs 個性バー */}
        <View style={styles.dualBar}>
          <View style={styles.dualBarLeft}>
            <Text style={styles.dualBarLabel}>{t.result.mainstream}</Text>
            <Text style={[styles.dualBarValue, { color: THEME.colors.accentBlue }]}>{mainstream_score}%</Text>
          </View>
          <View style={styles.dualBarTrack}>
            <View style={[styles.dualBarFillLeft, { width: `${mainstream_score}%` as any }]} />
          </View>
          <View style={styles.dualBarRight}>
            <Text style={[styles.dualBarValue, { color: THEME.colors.accent }]}>{uniqueness_score}%</Text>
            <Text style={styles.dualBarLabel}>{t.result.unique}</Text>
          </View>
        </View>
      </Animated.View>

      {/* ─── レアリティバッジ ─── */}
      <Animated.View style={[styles.rarityCard, { opacity: fadeAnim }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {rarity?.icon && (
            <Feather name={rarity.icon as any} size={16} color={THEME.colors.primary} />
          )}
          <Text style={styles.rarityLabel}>{rarity?.label || '—'}</Text>
        </View>
        <Text style={styles.rarityDesc}>{rarity?.description || ''}</Text>
      </Animated.View>

      {/* ─── 国別一致度 ─── */}
      <Animated.View style={[styles.sectionCard, { opacity: fadeAnim }]}>
        <View style={styles.titleRow}>
          <Feather name="globe" size={14} color={THEME.colors.text} />
          <Text style={styles.sectionTitle}>{t.result.countryRanking}</Text>
        </View>
        <View style={styles.topCountryBanner}>
          <CountryFlag code={country_affinity?.top_country} size={32} />
          <View>
            <Text style={styles.topCountryCaption}>{t.result.countryAffinity}</Text>
            <Text style={styles.topCountryName}>{country_affinity?.top_country_label}{t.result.countrySuffix}</Text>
            <Text style={styles.topCountryScore}>
              {i(t.result.countryMatch, { score: country_affinity?.top_country_score })}
            </Text>
          </View>
        </View>
        {top3Countries.map((c: any, i: number) => (
          <CountryBar
            key={c.country}
            code={c.country}
            label={c.label}
            score={c.score}
            isTop={i === 0}
          />
        ))}
        <Text style={styles.countryNote}>
          {summary_json?.country_analysis || ''}
        </Text>
      </Animated.View>

      {/* ─── 各種メーター ─── */}
      {meters && (
        <Animated.View style={[styles.sectionCard, { opacity: fadeAnim }]}>
          <View style={styles.titleRow}>
            <Feather name="bar-chart-2" size={14} color={THEME.colors.text} />
            <Text style={styles.sectionTitle}>{t.result.meterSection}</Text>
          </View>
          <Meter label={t.result.meters.gyaru}   value={meters.gyaru_level}        color="#FB923C" />
          <Meter label={t.result.meters.pure}     value={meters.pure_level}         color="#34D399" />
          <Meter label={t.result.meters.sexy} value={meters.sexy_level}         color="#F87171" />
          <Meter label={t.result.meters.mature}     value={meters.mature_level}       color="#C084FC" />
          <Meter label={t.result.meters.intellectual} value={meters.intellectual_level} color="#60A5FA" />
          <Meter label={t.result.meters.global} value={meters.global_level}       color="#FBBF24" />
        </Animated.View>
      )}

      {/* ─── 年齢・体型傾向 ─── */}
      <Animated.View style={[styles.sectionCard, { opacity: fadeAnim }]}>
        <View style={styles.titleRow}>
          <Feather name="info" size={14} color={THEME.colors.text} />
          <Text style={styles.sectionTitle}>{t.result.detailSection}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailChip}>
            <Feather name="calendar" size={18} color={THEME.colors.textSub} />
            <Text style={styles.detailChipLabel}>{t.result.ageLabel}</Text>
            <Text style={styles.detailChipValue}>{age_preference?.label || '—'}</Text>
          </View>
          <View style={styles.detailChip}>
            <Ionicons name="sparkles" size={18} color={THEME.colors.textSub} />
            <Text style={styles.detailChipLabel}>{t.result.vibeLabel}</Text>
            <Text style={styles.detailChipValue}>{vibe_preference?.label || '—'}</Text>
          </View>
        </View>

        <View style={styles.analysisBox}>
          <Text style={styles.analysisText}>{summary_json?.style_analysis}</Text>
        </View>
        {summary_json?.body_analysis ? (
          <View style={[styles.analysisBox, { marginTop: 8 }]}>
            <Text style={styles.analysisText}>{summary_json.body_analysis}</Text>
          </View>
        ) : null}
        {summary_json?.age_analysis ? (
          <View style={[styles.analysisBox, { marginTop: 8 }]}>
            <Text style={styles.analysisText}>{summary_json.age_analysis}</Text>
          </View>
        ) : null}
      </Animated.View>

      {/* ─── タグ ─── */}
      {summary_json?.top_tags?.length > 0 && (
        <Animated.View style={[styles.sectionCard, { opacity: fadeAnim }]}>
          <View style={styles.titleRow}>
            <Feather name="tag" size={14} color={THEME.colors.text} />
            <Text style={styles.sectionTitle}>{t.result.tagSection}</Text>
          </View>
          <View style={styles.tagRow}>
            {summary_json.top_tags.map((tag: string, i: number) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* ─── アクション ─── */}
      <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
        <Pressable
          style={({ pressed }) => [styles.shareBtn, pressed && styles.pressed]}
          onPress={handleShare}
          accessibilityLabel={t.result.shareX}
        >
          <Text style={styles.shareBtnText}>{t.result.shareX}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
          onPress={() => router.replace('/setup')}
          accessibilityLabel={t.result.retryBtn}
        >
          <Text style={styles.retryBtnText}>{t.result.retryBtn}</Text>
        </Pressable>

        <Pressable style={styles.homeLink} onPress={() => router.replace('/')}>
          <Text style={styles.homeLinkText}>{t.common.backHome}</Text>
        </Pressable>
      </Animated.View>

      <AdSlot placement="result_bottom" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: THEME.colors.background,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
  },
  bgBlob: {
    position: 'absolute',
    top: 100,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(79,107,88,0.04)',
    ...Platform.select({ web: { filter: 'blur(70px)' } }),
  },
  fullCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.background,
    gap: 20,
  },
  loadingSpinner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'rgba(175,82,57,0.15)',
    borderTopColor: THEME.colors.primary,
    ...Platform.select({
      web: {
        animationKeyframes: {
          from: { transform: [{ rotate: '0deg' }] },
          to:   { transform: [{ rotate: '360deg' }] },
        },
        animationDuration: '0.8s',
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
      },
    }),
  },
  loadingText: { color: THEME.colors.textSub, fontSize: 14 },
  errorText: { color: THEME.colors.skip, fontSize: 16, fontWeight: '700' },
  ghostBtn: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  ghostBtnText: { color: THEME.colors.textSub, fontWeight: '600', fontSize: 14 },

  // ─── ヒーローカード ───
  heroCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 24,
    ...THEME.shadow,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  typeEmoji: { fontSize: 36 },
  typeCaption: { fontSize: 10, color: THEME.colors.textMuted, letterSpacing: 1, marginBottom: 2 },
  typeName: { fontSize: 20, fontWeight: '800', color: THEME.colors.text },
  dualBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  dualBarLeft: { alignItems: 'flex-end', width: 52 },
  dualBarRight: { alignItems: 'flex-start', width: 52 },
  dualBarLabel: { fontSize: 9, color: THEME.colors.textMuted, letterSpacing: 0.5 },
  dualBarValue: { fontSize: 14, fontWeight: '800' },
  dualBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: THEME.colors.surfaceHigh,
    borderRadius: 3,
    overflow: 'hidden',
  },
  dualBarFillLeft: {
    height: '100%',
    backgroundColor: THEME.colors.accentBlue,
    borderRadius: 3,
  },

  // ─── レアリティ ───
  rarityCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(175,82,57,0.06)',
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(175,82,57,0.20)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 4,
  },
  rarityLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  rarityDesc: {
    fontSize: 12,
    color: THEME.colors.textSub,
    lineHeight: 18,
  },

  // ─── セクションカード共通 ───
  sectionCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 20,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.text,
    letterSpacing: 0.3,
  },

  // ─── 国別 ───
  topCountryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(175,82,57,0.06)',
    borderRadius: THEME.radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(175,82,57,0.15)',
  },
  topCountryFlag: { fontSize: 32 },
  topCountryCaption: { fontSize: 10, color: THEME.colors.textMuted },
  topCountryName: { fontSize: 18, fontWeight: '800', color: THEME.colors.text },
  topCountryScore: { fontSize: 12, color: THEME.colors.primary, fontWeight: '600' },
  countryNote: { fontSize: 11, color: THEME.colors.textMuted, lineHeight: 16 },

  // ─── 詳細チップ ───
  detailRow: { flexDirection: 'row', gap: 10 },
  detailChip: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceHigh,
    borderRadius: THEME.radius.sm,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  detailChipIcon: { fontSize: 18 },
  detailChipLabel: { fontSize: 10, color: THEME.colors.textMuted },
  detailChipValue: { fontSize: 13, fontWeight: '700', color: THEME.colors.text },

  // ─── 分析テキスト ───
  analysisBox: {
    backgroundColor: THEME.colors.surfaceHigh,
    borderRadius: THEME.radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  analysisText: { fontSize: 12, color: THEME.colors.textSub, lineHeight: 18 },

  // ─── タグ ───
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(79,107,88,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79,107,88,0.20)',
    borderRadius: THEME.radius.full,
  },
  tagText: { fontSize: 12, color: THEME.colors.accent, fontWeight: '600' },

  // ─── アクション ───
  actions: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    gap: 12,
  },
  shareBtn: {
    width: '100%',
    height: 52,
    borderRadius: THEME.radius.full,
    backgroundColor: '#1D9BF0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  shareBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  retryBtn: {
    width: '100%',
    height: 52,
    borderRadius: THEME.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        backgroundColor: THEME.colors.primary,
        cursor: 'pointer',
      },
      default: { backgroundColor: THEME.colors.primary },
    }),
  },
  retryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  homeLink: { paddingVertical: 8, ...Platform.select({ web: { cursor: 'pointer' } }) },
  homeLinkText: { fontSize: 13, color: THEME.colors.textMuted },

  pressed: { opacity: 0.75 },
});
