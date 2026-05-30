// stats.tsx - 統計画面
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDiagnosisStore } from '../src/stores/useDiagnosisStore';
import { supabase } from '../src/lib/supabase';
import { THEME } from '../src/theme/theme';
import { AdSlot } from '../src/components/ad/AdSlot';
import { getDiagnosisHistory } from '../src/services/resultService';
import { translateInternalTag } from '../src/services/scoringService';

interface StyleStats {
  style_group: string;
  avg_like_rate: number;
  total_votes: number;
}

interface RegionalStats {
  regional_style: string;
  avg_like_rate: number;
  total_votes: number;
}

interface TagStats {
  tag: string;
  avg_like_rate: number;
  total_votes: number;
}

// 静的なフォールバック統計データ (初期状態、オフライン時用)
const FALLBACK_STATS = {
  style_groups: [
    { style_group: 'natural', avg_like_rate: 65.4, total_votes: 120 },
    { style_group: 'clean', avg_like_rate: 62.1, total_votes: 95 },
    { style_group: 'korean', avg_like_rate: 61.5, total_votes: 110 },
    { style_group: 'casual', avg_like_rate: 58.8, total_votes: 85 },
    { style_group: 'cool', avg_like_rate: 54.2, total_votes: 90 },
  ],
  regional_styles: [
    { regional_style: 'japanese_style', avg_like_rate: 63.8, total_votes: 120 },
    { regional_style: 'korean_style', avg_like_rate: 61.5, total_votes: 110 },
    { regional_style: 'western_style', avg_like_rate: 56.4, total_votes: 150 },
  ],
  popular_tags: [
    { tag: 'ナチュラル', avg_like_rate: 68.2, total_votes: 80 },
    { tag: '清楚', avg_like_rate: 65.1, total_votes: 75 },
    { tag: 'トレンド', avg_like_rate: 62.4, total_votes: 90 },
    { tag: '笑顔', avg_like_rate: 60.5, total_votes: 110 },
    { tag: 'オフィス', avg_like_rate: 56.7, total_votes: 60 },
  ],
};

const translateStyleGroup = (style: string): string => {
  const map: Record<string, string> = {
    natural: 'ナチュラル',
    clean: '清楚クリーン',
    cool: 'クール都会派',
    mode: '個性派モード',
    casual: 'カジュアル',
    feminine: '柔らかフェミニン',
    korean: '韓国トレンド',
    office: 'オフィス上品',
    mature: '大人っぽい',
    simple: 'シンプルミニマル',
    travel: 'トラベル雰囲気',
    cafe: 'カフェリラックス',
  };
  return map[style] || style;
};

export default function StatsScreen() {
  const router = useRouter();
  const anonymousUserId = useDiagnosisStore((state) => state.anonymousUserId);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [myTopStyle, setMyTopStyle] = useState<string>('未計測');
  const [myAvgScore, setMyAvgScore] = useState<number | null>(null);

  useEffect(() => {
    const loadStatsData = async () => {
      setLoading(true);

      // 1. 全体統計をRPCから取得
      try {
        const { data, error } = await supabase.rpc('get_overall_stats');
        if (!error && data && (data.style_groups?.length > 0 || data.regional_styles?.length > 0)) {
          setStats(data);
        } else {
          setStats(FALLBACK_STATS);
        }
      } catch {
        setStats(FALLBACK_STATS);
      }

      // 2. ユーザーの自己履歴から集計
      if (anonymousUserId) {
        const history = await getDiagnosisHistory(anonymousUserId);
        if (history.length > 0) {
          // 平均世間一致度
          const avg = Math.round(
            history.reduce((acc, curr) => acc + curr.compatibility_score, 0) / history.length,
          );
          setMyAvgScore(avg);

          // 最多の好みタイプ
          const counts: Record<string, number> = {};
          history.forEach((h) => {
            counts[h.preference_type] = (counts[h.preference_type] || 0) + 1;
          });
          const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
          if (sorted[0]) {
            setMyTopStyle(sorted[0][0]);
          }
        }
      }

      setLoading(false);
    };

    loadStatsData();
  }, [anonymousUserId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>統計データを集計中...</Text>
      </View>
    );
  }

  const styleGroups: StyleStats[] = stats?.style_groups || FALLBACK_STATS.style_groups;
  const regionalStyles: RegionalStats[] = stats?.regional_styles || FALLBACK_STATS.regional_styles;
  const popularTags: TagStats[] = stats?.popular_tags || FALLBACK_STATS.popular_tags;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 自己分析との比較セクション */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👤 あなたの好み傾向（平均）</Text>
        <View style={styles.compareRow}>
          <View style={styles.compareItem}>
            <Text style={styles.compareVal}>{myTopStyle}</Text>
            <Text style={styles.compareLbl}>最多タイプ</Text>
          </View>
          <View style={styles.compareDivider} />
          <View style={styles.compareItem}>
            <Text style={styles.compareVal}>
              {myAvgScore !== null ? `${myAvgScore}%` : '未診断'}
            </Text>
            <Text style={styles.compareLbl}>平均世間一致度</Text>
          </View>
        </View>
        {myAvgScore === null && (
          <Pressable style={styles.startBtn} onPress={() => router.push('/setup')}>
            <Text style={styles.startBtnTxt}>診断して統計を比較する</Text>
          </Pressable>
        )}
      </View>

      {/* 人気スタイルグループ */}
      <Text style={styles.sectionTitle}>✨ 全体人気スタイルグループ (Like率順)</Text>
      <View style={styles.listCard}>
        {styleGroups.slice(0, 5).map((item, idx) => (
          <View key={idx} style={styles.statRow}>
            <View style={styles.statLeft}>
              <Text style={styles.rankNum}>{idx + 1}</Text>
              <Text style={styles.statLabel}>{translateStyleGroup(item.style_group)}</Text>
            </View>
            <View style={styles.statRight}>
              <Text style={styles.rateVal}>{item.avg_like_rate}%</Text>
              <View style={styles.miniBarBg}>
                <View style={[styles.miniBarFill, { width: `${item.avg_like_rate}%` }]} />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* 人気ビジュアルテイスト */}
      <Text style={styles.sectionTitle}>🌐 全体人気ビジュアルテイスト (Like率順)</Text>
      <View style={styles.listCard}>
        {regionalStyles.slice(0, 5).map((item, idx) => (
          <View key={idx} style={styles.statRow}>
            <View style={styles.statLeft}>
              <Text style={styles.rankNum}>{idx + 1}</Text>
              <Text style={styles.statLabel}>
                {translateInternalTag('regional_style', item.regional_style)}
              </Text>
            </View>
            <View style={styles.statRight}>
              <Text style={styles.rateVal}>{item.avg_like_rate}%</Text>
              <View style={styles.miniBarBg}>
                <View style={[styles.miniBarFill, { width: `${item.avg_like_rate}%` }]} />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* 注目キーワード */}
      <Text style={styles.sectionTitle}>🏷️ 注目タグランキング</Text>
      <View style={styles.listCard}>
        {popularTags.slice(0, 5).map((item, idx) => (
          <View key={idx} style={styles.statRow}>
            <View style={styles.statLeft}>
              <Text style={styles.rankNum}>{idx + 1}</Text>
              <Text style={styles.statLabel}>#{item.tag}</Text>
            </View>
            <View style={styles.statRight}>
              <Text style={styles.rateVal}>{item.avg_like_rate}%</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 広告スロット */}
      <AdSlot placement="stats_bottom" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: THEME.colors.background,
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: THEME.colors.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.lg,
    padding: 20,
    marginBottom: 24,
    ...THEME.shadow,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 16,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  compareItem: {
    alignItems: 'center',
    flex: 1,
  },
  compareVal: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  compareLbl: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  compareDivider: {
    width: 1,
    height: 40,
    backgroundColor: THEME.colors.border,
  },
  startBtn: {
    marginTop: 20,
    height: 40,
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  startBtnTxt: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  listCard: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    padding: 12,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankNum: {
    width: 24,
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.accent,
  },
  statLabel: {
    fontSize: 13,
    color: THEME.colors.text,
    fontWeight: '600',
  },
  statRight: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 130,
    justifyContent: 'flex-end',
  },
  rateVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginRight: 8,
    width: 38,
    textAlign: 'right',
  },
  miniBarBg: {
    width: 80,
    height: 6,
    backgroundColor: THEME.colors.surfaceHigh,
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.primary,
    borderRadius: 3,
  },
});
