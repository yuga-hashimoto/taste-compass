// SwipeCard.tsx - スワイプ対応画像カードコンポーネント
import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { THEME } from '../../theme/theme';
import { ImageMetadata } from '../../services/scoringService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // この距離以上ドラッグしたらスワイプ判定

interface SwipeCardProps {
  image: ImageMetadata;
  onSwipeLeft: () => void; // スキップ
  onSwipeRight: () => void; // 好き
  active: boolean; // 最前面にあるかどうか
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  image,
  onSwipeLeft,
  onSwipeRight,
  active,
}) => {
  const position = React.useMemo(() => new Animated.ValueXY(), []);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);

  const onSwipeComplete = useCallback(
    (direction: 'right' | 'left') => {
      if (direction === 'right') {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
      // 次のカードのために位置をリセット
      position.setValue({ x: 0, y: 0 });
    },
    [onSwipeLeft, onSwipeRight, position],
  );

  // 強制スワイプアニメーション (ボタン操作や外部キーボード操作から呼ばれる)
  const forceSwipe = useCallback(
    (direction: 'right' | 'left') => {
      const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
      Animated.timing(position, {
        toValue: { x, y: 0 },
        duration: 250,
        useNativeDriver: false, // Web互換性のためにfalse
      }).start(() => onSwipeComplete(direction));
    },
    [onSwipeComplete, position],
  );

  const resetPosition = useCallback(() => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 6,
      useNativeDriver: false,
    }).start();
  }, [position]);

  // PanResponder の設定 (ドラッグ操作)
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => active,
        onPanResponderMove: (evt, gestureState) => {
          if (!active) return;
          position.setValue({ x: gestureState.dx, y: gestureState.dy });
        },
        onPanResponderRelease: (evt, gestureState) => {
          if (!active) return;

          if (gestureState.dx > SWIPE_THRESHOLD) {
            // 右スワイプ (好き)
            forceSwipe('right');
          } else if (gestureState.dx < -SWIPE_THRESHOLD) {
            // 左スワイプ (スキップ)
            forceSwipe('left');
          } else {
            // 元の位置に戻す
            resetPosition();
          }
        },
      }),
    [active, position, forceSwipe, resetPosition],
  );

  // 外部からのキーボード操作やボタン操作の受け皿として、親コンポーネントがref経由で呼び出せるようになればベストだが、
  // 今回は「active」なカードに対してのみ親からアニメーションを直接走らせるロジックは必要なく、
  // 親のボタンクリック時には、親からこのコンポーネントの強制スワイプをキックする仕組みを提供する。
  // そのために useEffect で props 変更による強制スワイプをトリガーできるようにする。
  // (親からグローバルイベントや state 経由でキックできるように、少し細工しておく)

  // カードの回転と移動のスタイル設定
  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-30deg', '0deg', '30deg'],
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }],
    };
  };

  // LIKE/SKIP ラベルの不透明度
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH * 0.15],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const skipOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.15, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (!active) {
    // 背面にあるカードは静的に描画する
    return (
      <View style={[styles.cardContainer, styles.backCard]}>
        <View style={styles.card}>
          <Image
            source={{ uri: image.image_url }}
            style={styles.image as any}
            contentFit="cover"
            transition={200}
          />
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.cardContainer, getCardStyle()]} {...panResponder.panHandlers}>
      <View style={styles.card}>
        <Image
          source={{ uri: image.image_url }}
          style={styles.image as any}
          contentFit="cover"
          onLoadStart={() => {
            setLoading(true);
            setLoadError(false);
          }}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setLoadError(true);
          }}
          transition={200}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
          </View>
        )}

        {loadError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>画像の読み込みに失敗しました</Text>
            <Text style={styles.errorSubText}>タップして再読み込み</Text>
          </View>
        )}

        {/* LIKE オーバーレイインジケータ */}
        <Animated.View
          style={[styles.overlayIndicator, styles.likeIndicator, { opacity: likeOpacity }]}
        >
          <Text style={[styles.indicatorText, { color: THEME.colors.like }]}>好き</Text>
        </Animated.View>

        {/* SKIP オーバーレイインジケータ */}
        <Animated.View
          style={[styles.overlayIndicator, styles.skipIndicator, { opacity: skipOpacity }]}
        >
          <Text style={[styles.indicatorText, { color: THEME.colors.skip }]}>スキップ</Text>
        </Animated.View>

        {/* 露出保護/利用規約に関する小さなウォーターマーク（本番品質） */}
        <View style={styles.watermark}>
          <Text style={styles.watermarkText}>AI生成架空ビジュアル | 好みズレ診断</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    // Web等でのドラッグ時の選択防止
    ...Platform.select({
      web: {
        cursor: 'grab',
        userSelect: 'none',
      } as any,
      default: {},
    }),
  },
  backCard: {
    // 背面カードは少し縮小させて奥行き感を出す
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  card: {
    width: '90%',
    height: '85%',
    maxWidth: 400,
    maxHeight: 550,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: THEME.colors.skip,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorSubText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
  },
  overlayIndicator: {
    position: 'absolute',
    top: 40,
    borderWidth: 4,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 10,
  },
  likeIndicator: {
    left: 40,
    borderColor: THEME.colors.like,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    transform: [{ rotate: '-15deg' }],
  },
  skipIndicator: {
    right: 40,
    borderColor: THEME.colors.skip,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    transform: [{ rotate: '15deg' }],
  },
  indicatorText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  watermark: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  watermarkText: {
    fontSize: 8,
    color: '#CCC',
  },
});
