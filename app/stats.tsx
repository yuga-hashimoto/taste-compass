// stats.tsx - 統計画面（「みんなの統計」拡張版）
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useDiagnosisStore } from '../src/stores/useDiagnosisStore';
import { supabase } from '../src/lib/supabase';
import { THEME } from '../src/theme/theme';
import { AdSlot } from '../src/components/ad/AdSlot';
import { getDiagnosisHistory } from '../src/services/resultService';
import { translateInternalTag } from '../src/services/scoringService';
import { useI18n } from '../src/i18n';
import { Feather } from '@expo/vector-icons';
import { ThemeIcon } from '../src/components/ui/ThemeIcon';
import { LOCAL_IMAGES } from '../src/data/imageMetadata';
import { toDeterministicUUID } from '../src/lib/uuid';
import { ENV } from '../src/lib/env';

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

interface ImageRankingItem {
  id: string;
  image_url: string;
  style_group: string;
  regional_style: string;
  like_rate: number;
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

export default function StatsScreen() {
  const router = useRouter();
  const anonymousUserId = useDiagnosisStore((state) => state.anonymousUserId);
  const { t, i } = useI18n();

  // 国・地域別リストの動的構成 (14言語フルサポート)
  const countries = [
    { code: 'all', label: t.stats.countries?.all || '🌏 Global' },
    { code: 'ja', label: t.stats.countries?.ja || '🇯🇵 Japan' },
    { code: 'ko', label: t.stats.countries?.ko || '🇰🇷 Korea' },
    { code: 'en', label: t.stats.countries?.en || '🇺🇸 English' },
    { code: 'zh-CN', label: t.stats.countries?.zhCN || '🇨🇳 China' },
    { code: 'zh-TW', label: t.stats.countries?.zhTW || '🇹🇼 Taiwan' },
    { code: 'ar', label: t.stats.countries?.ar || '🇸🇦 Arabic' },
    { code: 'de', label: t.stats.countries?.de || '🇩🇪 German' },
    { code: 'es', label: t.stats.countries?.es || '🇪🇸 Spanish' },
    { code: 'fr', label: t.stats.countries?.fr || '🇫🇷 French' },
    { code: 'hi', label: t.stats.countries?.hi || '🇮🇳 Hindi' },
    { code: 'id', label: t.stats.countries?.id || '🇮🇩 Indonesian' },
    { code: 'pt', label: t.stats.countries?.pt || '🇵🇹 Portuguese' },
    { code: 'th', label: t.stats.countries?.th || '🇹🇭 Thai' },
    { code: 'vi', label: t.stats.countries?.vi || '🇻🇳 Vietnamese' },
  ];

  // 画面モード & 状態
  const [activeTab, setActiveTab] = useState<'my' | 'everyone'>('my');
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [myTopStyle, setMyTopStyle] = useState<string | null>(null);
  const [myTopStyleIcon, setMyTopStyleIcon] = useState<string>('');
  const [myAvgScore, setMyAvgScore] = useState<number | null>(null);

  // みんなの統計データ
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [everyoneStats, setEveryoneStats] = useState<ImageRankingItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 1. 自己分析・全体統計サマリーのロード
  useEffect(() => {
    const loadStatsData = async () => {
      setLoading(true);

      // 全体統計をRPCから取得
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

      // ユーザーの自己履歴から集計
      if (anonymousUserId) {
        const history = await getDiagnosisHistory(anonymousUserId);
        if (history.length > 0) {
          const avg = Math.round(
            history.reduce((acc, curr) => acc + curr.compatibility_score, 0) / history.length,
          );
          setMyAvgScore(avg);

          const counts: Record<string, number> = {};
          const iconMap: Record<string, string> = {};
          history.forEach((h) => {
            counts[h.preference_type] = (counts[h.preference_type] || 0) + 1;
            if (h.preference_type_emoji) {
              iconMap[h.preference_type] = h.preference_type_emoji;
            }
          });
          const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
          if (sorted[0]) {
            setMyTopStyle(sorted[0][0]);
            setMyTopStyleIcon(iconMap[sorted[0][0]] || '');
          }
        }
      }

      setLoading(false);
    };

    loadStatsData();
  }, [anonymousUserId]);

  // 2. 「みんなの統計（画像ランキング）」のロード
  const loadEveryoneStats = async (country: string) => {
    setStatsLoading(true);
    try {
      if (ENV.IS_MOCK) {
        // モックデータの生成 (決定論的に生成してリロードでのチラつきを防止)
        const mockData: ImageRankingItem[] = LOCAL_IMAGES.map((img) => {
          const hash = img.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const total = 25 + (hash % 150); // 25〜175票

          let rateOffset = 0;
          if (country !== 'all') {
            const countryHash = country
              .split('')
              .reduce((acc, char) => acc + char.charCodeAt(0), 0);
            rateOffset = ((hash + countryHash) % 26) - 13; // -13%〜+13%
          }

          let like_rate = img.popularity_score + rateOffset;
          like_rate = Math.max(35, Math.min(92, like_rate));

          return {
            id: img.id,
            image_url: img.image_url,
            style_group: img.style_group,
            regional_style: img.regional_style || 'global_mixed',
            like_rate: Math.round(like_rate),
            total_votes: total,
          };
        });

        mockData.sort((a, b) => {
          if (b.like_rate !== a.like_rate) {
            return b.like_rate - a.like_rate;
          }
          return b.total_votes - a.total_votes;
        });
        setEveryoneStats(mockData.slice(0, 10)); // Top 10のみ
      } else {
        // --- ローカルキャッシュ確認 ---
        const cacheKey = `taste_compass_stats_cache_${country}`;
        try {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const isFresh = Date.now() - timestamp < 5 * 60 * 1000; // 5分以内
            if (isFresh && data && data.length > 0) {
              setEveryoneStats(data);
              setStatsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to read stats cache:', e);
        }

        // 実データクエリ
        let finalData: ImageRankingItem[] = [];

        if (country === 'all') {
          const { data, error } = await supabase
            .from('image_stats')
            .select('image_id, like_rate, total_votes')
            .gt('total_votes', 0) // 1票以上のものに限定
            .order('like_rate', { ascending: false })
            .order('total_votes', { ascending: false }) // 同率の場合は総投票数が多い順
            .limit(10);

          if (!error && data) {
            finalData = data.map((row: any) => {
              const img = LOCAL_IMAGES.find(
                (i) => i.id === row.image_id || toDeterministicUUID(i.id) === row.image_id,
              );
              return {
                id: img?.id || row.image_id,
                image_url: img?.image_url || '',
                style_group: img?.style_group || 'other',
                regional_style: img?.regional_style || 'global_mixed',
                like_rate: Math.round(row.like_rate),
                total_votes: row.total_votes,
              };
            });
          }
        } else {
          // 国別データ取得
          const { data, error } = await supabase
            .from('image_country_stats')
            .select('image_id, like_count, skip_count')
            .eq('country_code', country);

          if (!error && data) {
            const merged: ImageRankingItem[] = data
              .map((row: any) => {
                const total = row.like_count + row.skip_count;
                const rate = total > 0 ? Math.round((row.like_count / total) * 100) : 50;
                const img = LOCAL_IMAGES.find(
                  (i) => i.id === row.image_id || toDeterministicUUID(i.id) === row.image_id,
                );
                return {
                  id: img?.id || row.image_id,
                  image_url: img?.image_url || '',
                  style_group: img?.style_group || 'other',
                  regional_style: img?.regional_style || 'global_mixed',
                  like_rate: rate,
                  total_votes: total,
                };
              })
              .filter((i) => i.total_votes > 0); // 投票ありのみ

            merged.sort((a, b) => {
              if (b.like_rate !== a.like_rate) {
                return b.like_rate - a.like_rate;
              }
              return b.total_votes - a.total_votes;
            });
            finalData = merged.slice(0, 10);
          }
        }

        setEveryoneStats(finalData);

        // --- ローカルキャッシュ保存 ---
        if (finalData.length > 0) {
          try {
            await AsyncStorage.setItem(
              cacheKey,
              JSON.stringify({ data: finalData, timestamp: Date.now() }),
            );
          } catch (e) {
            console.warn('Failed to write stats cache:', e);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load everyone stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // タブ切り替え、国切り替えでロード
  useEffect(() => {
    if (activeTab === 'everyone') {
      const timer = setTimeout(() => {
        loadEveryoneStats(selectedCountry);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab, selectedCountry]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>{t.stats.loading}</Text>
      </View>
    );
  }

  const styleGroups: StyleStats[] = stats?.style_groups || FALLBACK_STATS.style_groups;
  const regionalStyles: RegionalStats[] = stats?.regional_styles || FALLBACK_STATS.regional_styles;
  const popularTags: TagStats[] = stats?.popular_tags || FALLBACK_STATS.popular_tags;

  return (
    <View style={{ flex: 1, backgroundColor: THEME.colors.background }}>
      {/* ─── タブ切り替え（Segment Control） ─── */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabButton, activeTab === 'my' && styles.tabButtonActive]}
          onPress={() => setActiveTab('my')}
        >
          <Feather
            name="user"
            size={14}
            color={activeTab === 'my' ? '#fff' : THEME.colors.textSub}
          />
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            {t.stats.compareTitle}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'everyone' && styles.tabButtonActive]}
          onPress={() => setActiveTab('everyone')}
        >
          <Feather
            name="users"
            size={14}
            color={activeTab === 'everyone' ? '#fff' : THEME.colors.textSub}
          />
          <Text style={[styles.tabText, activeTab === 'everyone' && styles.tabTextActive]}>
            {t.stats.everyoneTitle}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {activeTab === 'my' ? (
          // ─── あなたの統計タブ ───
          <>
            {/* 自己分析との比較 */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Feather name="bar-chart-2" size={14} color={THEME.colors.text} />
                <Text style={styles.cardTitle}>{t.stats.mySummaryTitle}</Text>
              </View>
              <View style={styles.compareRow}>
                <View style={styles.compareItem}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    {myTopStyle !== null && myTopStyleIcon ? (
                      <ThemeIcon themeId={myTopStyleIcon} size={18} color={THEME.colors.primary} />
                    ) : null}
                    <Text style={[styles.compareVal, { marginBottom: 0 }]}>
                      {myTopStyle === null ? t.stats.notMeasured : myTopStyle}
                    </Text>
                  </View>
                  <Text style={styles.compareLbl}>{t.stats.mostType}</Text>
                </View>
                <View style={styles.compareDivider} />
                <View style={styles.compareItem}>
                  <Text style={styles.compareVal}>
                    {myAvgScore !== null ? `${myAvgScore}%` : t.stats.notDiagnosed}
                  </Text>
                  <Text style={styles.compareLbl}>{t.stats.averageCompatibility}</Text>
                </View>
              </View>
              {myAvgScore === null && (
                <Pressable style={styles.startBtn} onPress={() => router.push('/setup')}>
                  <Text style={styles.startBtnTxt}>{t.stats.compareStatsBtn}</Text>
                </Pressable>
              )}
            </View>

            {/* 人気スタイルグループ */}
            <View style={styles.sectionTitleRow}>
              <Feather name="award" size={14} color={THEME.colors.text} />
              <Text style={styles.sectionTitle}>{t.stats.overallStyleTitle}</Text>
            </View>
            <View style={styles.listCard}>
              {styleGroups.slice(0, 5).map((item, idx) => (
                <View key={idx} style={styles.statRow}>
                  <View style={styles.statLeft}>
                    <Text style={styles.rankNum}>{idx + 1}</Text>
                    <Text style={styles.statLabel}>
                      {t.stats.styles[item.style_group as keyof typeof t.stats.styles] ||
                        item.style_group}
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

            {/* 人気ビジュアルテイスト */}
            <View style={styles.sectionTitleRow}>
              <Feather name="globe" size={14} color={THEME.colors.text} />
              <Text style={styles.sectionTitle}>{t.stats.overallTasteTitle}</Text>
            </View>
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
            <View style={styles.sectionTitleRow}>
              <Feather name="tag" size={14} color={THEME.colors.text} />
              <Text style={styles.sectionTitle}>{t.stats.popularTagsTitle}</Text>
            </View>
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
          </>
        ) : (
          // ─── みんなの統計タブ（写真ごとのLike率ランキング） ───
          <>
            {/* 国別横スクロールフィルター */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.countryFilterContainer}
              contentContainerStyle={styles.countryFilterContent}
            >
              {countries.map((country) => {
                const active = selectedCountry === country.code;
                return (
                  <Pressable
                    key={country.code}
                    style={[styles.countryChip, active && styles.countryChipActive]}
                    onPress={() => setSelectedCountry(country.code)}
                  >
                    <Text
                      style={[styles.countryChipLabel, active && styles.countryChipLabelActive]}
                    >
                      {country.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sectionTitleRow}>
              <Feather name="heart" size={14} color={THEME.colors.text} />
              <Text style={styles.sectionTitle}>{t.stats.rankingTitle}</Text>
            </View>

            {statsLoading ? (
              <View style={styles.tabLoading}>
                <ActivityIndicator size="small" color={THEME.colors.primary} />
                <Text style={styles.tabLoadingText}>{t.stats.rankingLoading}</Text>
              </View>
            ) : everyoneStats.length === 0 ? (
              <View style={styles.emptyCard}>
                <Feather name="inbox" size={32} color={THEME.colors.textMuted} />
                <Text style={styles.emptyText}>{t.stats.emptyData}</Text>
                <Text style={styles.emptySub}>{t.stats.emptyDataSub}</Text>
              </View>
            ) : (
              <View style={styles.rankingContainer}>
                {everyoneStats.map((item, idx) => {
                  // ランキングメダルのカラー決定
                  let medalColor = THEME.colors.textMuted;
                  if (idx === 0) medalColor = '#FFD700'; // 金
                  if (idx === 1) medalColor = '#C0C0C0'; // 銀
                  if (idx === 2) medalColor = '#CD7F32'; // 銅

                  return (
                    <View key={item.id} style={styles.rankRow}>
                      {/* 左側: 順位 ＆ 画像プレビュー */}
                      <View style={styles.rankLeft}>
                        {idx < 3 ? (
                          <View style={[styles.medal, { backgroundColor: medalColor }]}>
                            <Text style={styles.medalText}>{idx + 1}</Text>
                          </View>
                        ) : (
                          <Text style={styles.rankBadgeNum}>{idx + 1}</Text>
                        )}
                        <Pressable onPress={() => setSelectedImage(item.image_url)}>
                          <Image source={{ uri: item.image_url }} style={styles.rankThumbnail} />
                        </Pressable>
                        <View style={styles.rankDetails}>
                          <Text style={styles.rankImgId}>
                            {item.id.replace('tc_diag_b', 'B').replace('_s', ' S')}
                          </Text>
                          <Text style={styles.rankTags}>
                            {t.stats.styles[item.style_group as keyof typeof t.stats.styles] ||
                              item.style_group}{' '}
                            · {translateInternalTag('regional_style', item.regional_style)}
                          </Text>
                        </View>
                      </View>

                      {/* 右側: Like率 */}
                      <View style={styles.rankRight}>
                        <Text style={styles.rankLikeRate}>{item.like_rate}%</Text>
                        <Text style={styles.rankVotes}>
                          {i(t.stats.votesCount, { count: item.total_votes })}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* 広告スロット */}
        <AdSlot placement="stats_bottom" />
      </ScrollView>

      {/* ─── 画像タップ時の拡大プレビューモーダル ─── */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedImage(null)}>
          <View style={styles.modalContentLarge}>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.modalImageLarge}
                contentFit="contain"
              />
            )}
            <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedImage(null)}>
              <Text style={styles.modalCloseText}>{t.common.close}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
    ...Platform.select({ web: { cursor: 'pointer', transition: 'all 0.2s ease' } }),
  },
  tabButtonActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSub,
  },
  tabTextActive: {
    color: '#fff',
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
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    ...Platform.select({ web: { cursor: 'pointer' } }),
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
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  // ─── みんなの統計用スタイル ───
  countryFilterContainer: {
    maxHeight: 46,
    marginBottom: 18,
  },
  countryFilterContent: {
    paddingHorizontal: 2,
    gap: 8,
    alignItems: 'center',
  },
  countryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  countryChipActive: {
    backgroundColor: 'rgba(255,77,109,0.08)',
    borderColor: THEME.colors.primary,
  },
  countryChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSub,
  },
  countryChipLabelActive: {
    color: THEME.colors.primary,
  },
  tabLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 8,
  },
  tabLoadingText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  emptySub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  rankingContainer: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    padding: 12,
    marginBottom: 20,
    ...THEME.shadow,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  medal: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  rankBadgeNum: {
    width: 20,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: THEME.colors.textMuted,
  },
  rankThumbnail: {
    width: 44,
    height: 44,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceHigh,
    ...Platform.select({ web: { cursor: 'zoom-in' as any } }),
  },
  rankDetails: {
    justifyContent: 'center',
    gap: 2,
  },
  rankImgId: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  rankTags: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  rankRight: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  rankLikeRate: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.primary,
  },
  rankVotes: {
    fontSize: 9,
    color: THEME.colors.textMuted,
  },
  // モーダルレイアウト
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentLarge: {
    width: '90%',
    maxWidth: 480,
    aspectRatio: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  modalImageLarge: {
    width: '100%',
    height: '100%',
    borderRadius: THEME.radius.lg,
  },
  modalCloseBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: THEME.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
