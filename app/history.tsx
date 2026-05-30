// history.tsx - 履歴画面
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDiagnosisStore } from '../src/stores/useDiagnosisStore';
import { THEME } from '../src/theme/theme';
import { getDiagnosisHistory, DiagnosisResultItem } from '../src/services/resultService';
import { AdSlot } from '../src/components/ad/AdSlot';
import { trackEvent } from '../src/services/eventService';

export default function HistoryScreen() {
  const router = useRouter();
  const anonymousUserId = useDiagnosisStore((state) => state.anonymousUserId);

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<DiagnosisResultItem[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!anonymousUserId) return;
      setLoading(true);

      // 履歴取得イベントのトラッキング
      trackEvent(anonymousUserId, 'history_open');

      const data = await getDiagnosisHistory(anonymousUserId);
      setHistory(data);
      setLoading(false);
    };

    loadHistory();
  }, [anonymousUserId]);

  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(
        date.getHours(),
      ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  const renderItem = ({ item }: { item: DiagnosisResultItem }) => {
    return (
      <Pressable
        style={({ pressed }) => [styles.historyCard, pressed && styles.pressed]}
        onPress={() => router.push(`/result/${item.session_id}`)}
        accessibilityLabel={`診断結果: 一致度${item.compatibility_score}%、タイプ${item.preference_type}`}
        accessibilityRole="button"
      >
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>{item.compatibility_score}% 一致</Text>
          </View>
        </View>
        <Text style={styles.prefTypeText}>{item.preference_type}</Text>
        <Text style={styles.summaryText} numberOfLines={2}>
          {item.summary_json?.style_analysis}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.detailLinkText}>詳細を見る →</Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>履歴を読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.session_id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyText}>診断履歴がありません</Text>
            <Text style={styles.emptySub}>診断を行うと、ここに好みの履歴が保存されます</Text>
            <Pressable style={styles.startButton} onPress={() => router.push('/setup')}>
              <Text style={styles.startButtonText}>診断を始める</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={<AdSlot placement="history_bottom" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
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
  historyCard: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    padding: 16,
    marginBottom: 12,
    ...THEME.shadow,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  pressed: {
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  scoreBadge: {
    backgroundColor: 'rgba(147, 51, 234, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  scoreBadgeText: {
    fontSize: 10,
    color: THEME.colors.accent,
    fontWeight: 'bold',
  },
  prefTypeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 16,
    marginBottom: 12,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  detailLinkText: {
    fontSize: 12,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 24,
  },
  startButton: {
    height: 48,
    borderRadius: THEME.radius.xl,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    ...Platform.select({
      web: {
        backgroundImage: `linear-gradient(90deg, ${THEME.colors.primaryGradient[0]} 0%, ${THEME.colors.primaryGradient[1]} 100%)`,
        cursor: 'pointer',
      },
    }),
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
