// diagnosis.tsx - スワイプ診断画面
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, Modal, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useDiagnosisStore } from '../src/stores/useDiagnosisStore';
import { THEME } from '../src/theme/theme';
import { getDiagnosisImages } from '../src/services/imageService';
import { getMergedImageStats } from '../src/services/imageStatsService';
import { saveVote } from '../src/services/voteService';
import {
  updateSessionProgress,
  completeSession,
  createSession,
} from '../src/services/sessionService';
import { calculateDiagnosisResult } from '../src/services/scoringService';
import { saveDiagnosisResult } from '../src/services/resultService';
import { trackEvent } from '../src/services/eventService';
import { SwipeCard } from '../src/components/ui/SwipeCard';

export default function DiagnosisScreen() {
  const router = useRouter();

  // Zustandストア
  const anonymousUserId = useDiagnosisStore((state) => state.anonymousUserId);
  const currentSessionId = useDiagnosisStore((state) => state.currentSessionId);
  const currentTheme = useDiagnosisStore((state) => state.currentTheme);
  const totalImagesCount = useDiagnosisStore((state) => state.totalImagesCount);
  const updateProgress = useDiagnosisStore((state) => state.updateProgress);
  const endSession = useDiagnosisStore((state) => state.endSession);

  // 画面状態
  const [images, setImages] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // アクションを外部ボタンやキーボードからSwipeCardへ伝えるための一時フラグ
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. 診断完了時の計算と保存
  const handleComplete = useCallback(
    async (finalVotes: any[], currentImages: any[]) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        // 完了イベントトラッキング
        trackEvent(anonymousUserId, 'diagnosis_complete', {
          session_id: currentSessionId,
          total_votes: finalVotes.length,
        });

        // 統計データを取得してスコア計算
        const imageStats = await getMergedImageStats();
        const result = calculateDiagnosisResult(finalVotes, currentImages, imageStats);

        // 結果を保存
        await saveDiagnosisResult(anonymousUserId!, currentSessionId!, result);

        // セッションを完了状態にする
        await completeSession(currentSessionId!);

        // ストアのセッションをリセット
        const sessionId = currentSessionId;
        endSession();

        // 結果画面へ遷移
        router.replace(`/result/${sessionId}`);
      } catch (err) {
        console.error('Failed to complete diagnosis:', err);
        setIsSubmitting(false);
      }
    },
    [anonymousUserId, currentSessionId, isSubmitting, endSession, router],
  );

  // 2. 投票アクション
  const handleVote = useCallback(
    async (type: 'like' | 'skip') => {
      if (currentIndex >= images.length || isSubmitting) return;

      const currentImg = images[currentIndex];
      const newVote = { image_id: currentImg.id, vote_type: type };
      const updatedVotes = [...votes, newVote];
      setVotes(updatedVotes);

      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      updateProgress(nextIndex);

      // 匿名で非同期で投票ログを送信 (バックグラウンド同期的)
      saveVote({
        anonymous_user_id: anonymousUserId!,
        session_id: currentSessionId!,
        image_id: currentImg.id,
        vote_type: type,
      });

      // 進行状況をDBセッションに反映
      updateSessionProgress(currentSessionId!, nextIndex);

      // 全枚数完了時の処理
      if (nextIndex >= totalImagesCount) {
        handleComplete(updatedVotes, images);
      }
    },
    [
      anonymousUserId,
      currentSessionId,
      totalImagesCount,
      isSubmitting,
      handleComplete,
      updateProgress,
      images,
      votes,
      currentIndex,
    ],
  );

  // 3. 画像データのロード
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      if (!currentSessionId || !anonymousUserId) {
        if (isSubmitting || images.length > 0) return;
        router.replace('/');
        return;
      }

      setLoading(true);

      // DBにセッションレコードを作成
      await createSession({
        id: currentSessionId,
        anonymous_user_id: anonymousUserId,
        total_images: totalImagesCount,
      });

      const loadedImages = await getDiagnosisImages(currentTheme, totalImagesCount);

      if (active) {
        setImages(loadedImages);
        setLoading(false);

        // 画像のプリロード (expo-image)
        const urls = loadedImages.map((img) => img.image_url);
        Image.prefetch(urls);
      }
    };

    loadData();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId, anonymousUserId, currentTheme, totalImagesCount, router]);

  // 4. AndroidのバックボタンとWebのブラウザ離脱防止対策
  useEffect(() => {
    const onBackPress = () => {
      setExitModalVisible(true);
      return true; // デフォルトの戻る動作を抑止
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      subscription.remove();
    };
  }, []);

  // 5. Web用キーボードイベントリスナー
  useEffect(() => {
    if (Platform.OS !== 'web' || loading || currentIndex >= images.length) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        // スキップ
        handleVote('skip');
      } else if (e.key === 'ArrowRight') {
        // 好き
        handleVote('like');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, currentIndex, images.length, handleVote]);

  // 中断離脱処理
  const handleConfirmExit = () => {
    setExitModalVisible(false);
    endSession();
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicatorWrapper />
        <Text style={styles.loadingText}>診断画像をロード中...</Text>
        <Text style={styles.loadingSub}>お好みの傾向を分析する準備をしています</Text>
      </View>
    );
  }

  if (isSubmitting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicatorWrapper />
        <Text style={styles.loadingText}>診断結果を分析中...</Text>
        <Text style={styles.loadingSub}>あなたの好みのズレをパーセンテージで算出しています</Text>
      </View>
    );
  }

  const progress = currentIndex / totalImagesCount;
  const currentImage = images[currentIndex];

  return (
    <View style={styles.container}>
      {/* 上部ヘッダー情報 */}
      <View style={styles.header}>
        <Pressable
          style={styles.exitButton}
          onPress={() => setExitModalVisible(true)}
          accessibilityLabel="診断を中断して戻る"
        >
          <Text style={styles.exitButtonText}>✕ 中断</Text>
        </Pressable>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {currentIndex} / {totalImagesCount} 枚
          </Text>
        </View>
      </View>

      {/* プログレスバー */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* スワイプカードエリア */}
      <View style={styles.cardArea}>
        {currentIndex < images.length ? (
          // 最前面と背面の2枚を描画してプリロード効果を持たせる
          <>
            {currentIndex + 1 < images.length && (
              <SwipeCard
                key={images[currentIndex + 1].id}
                image={images[currentIndex + 1]}
                onSwipeLeft={() => {}}
                onSwipeRight={() => {}}
                active={false}
              />
            )}
            <SwipeCard
              key={currentImage.id}
              image={currentImage}
              onSwipeLeft={() => handleVote('skip')}
              onSwipeRight={() => handleVote('like')}
              active={true}
            />
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>集計中...</Text>
          </View>
        )}
      </View>

      {/* 下部操作ボタン (モバイルの片手操作に配慮) */}
      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.actionButton, styles.skipButton]}
          onPress={() => handleVote('skip')}
          accessibilityLabel="この画像をスキップ"
          accessibilityRole="button"
        >
          <Text style={styles.actionButtonText}>スキップ</Text>
          {Platform.OS === 'web' && <Text style={styles.keyGuide}>[ ← ]</Text>}
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleVote('like')}
          accessibilityLabel="この画像が好き"
          accessibilityRole="button"
        >
          <Text style={styles.actionButtonText}>好き</Text>
          {Platform.OS === 'web' && <Text style={styles.keyGuide}>[ → ]</Text>}
        </Pressable>
      </View>

      {/* 自前の中断確認モーダル (プレミアムUIデザイン) */}
      <Modal
        visible={exitModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setExitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>診断を中断しますか？</Text>
            <Text style={styles.modalDesc}>
              ここまでの診断進捗は保存されません。ホーム画面に戻りますか？
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setExitModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>続ける</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={handleConfirmExit}
              >
                <Text style={styles.modalConfirmText}>中断する</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 簡易 ActivityIndicator (Webの互換性のためのカスタムラッパー)
const ActivityIndicatorWrapper = () => <View style={styles.spinner} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  exitButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceHigh,
  },
  exitButtonText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressInfo: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: THEME.colors.surfaceHigh,
    width: '100%',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.accent,
  },
  cardArea: {
    flex: 1,
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    maxWidth: 160,
    height: 64,
    borderRadius: THEME.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    ...THEME.shadow,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.1s ease',
      },
    }),
  },
  likeButton: {
    backgroundColor: THEME.colors.like,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(0, 230, 118, 0.25)',
      },
      default: {
        shadowColor: THEME.colors.like,
      },
    }),
  },
  skipButton: {
    backgroundColor: THEME.colors.skip,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(255, 23, 68, 0.25)',
      },
      default: {
        shadowColor: THEME.colors.skip,
      },
    }),
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  keyGuide: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 24,
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'rgba(224, 64, 251, 0.1)',
    borderTopColor: THEME.colors.primary,
    ...Platform.select({
      web: {
        animationKeyframes: 'spin',
        animationDuration: '1s',
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
      },
    }),
  },
  // モーダルスタイル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.lg,
    padding: 24,
    alignItems: 'center',
    ...THEME.shadow,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  modalCancel: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  modalCancelText: {
    color: THEME.colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalConfirm: {
    backgroundColor: THEME.colors.skip,
  },
  modalConfirmText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

// CSSキーフレームのインジェクション (Web用スピンアニメーション)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
