// CountryFlag.tsx - CSS/Viewベースの丸型国旗アバターバッジ
import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';

interface CountryFlagProps {
  code?: string | null; // 国キー(japan, usa等) または 言語コード(ja, en等)
  size?: number;
  style?: ViewStyle;
}

export function CountryFlag({ code, size = 20, style }: CountryFlagProps) {
  const norm = (code || '').toLowerCase().trim();

  // 国・言語コードの正規化マッピング
  let flagKey = norm;
  if (['ja', 'japan', 'jp'].includes(norm)) flagKey = 'japan';
  else if (['ko', 'korea', 'kr'].includes(norm)) flagKey = 'korea';
  else if (['en', 'usa', 'us'].includes(norm)) flagKey = 'usa';
  else if (['de', 'es', 'fr', 'it', 'pt', 'europe', 'eu', 'ru'].includes(norm)) {
    // ヨーロッパ諸国 (一部は個別国旗、その他はEU旗をベースに)
    if (norm === 'fr') flagKey = 'france';
    else if (norm === 'de') flagKey = 'germany';
    else if (norm === 'it') flagKey = 'italy';
    else if (norm === 'es') flagKey = 'spain';
    else if (norm === 'ru') flagKey = 'russia';
    else if (norm === 'pt') flagKey = 'portugal';
    else flagKey = 'europe';
  } else if (['zh-cn', 'cn', 'china'].includes(norm)) flagKey = 'china';
  else if (['zh-tw', 'tw', 'taiwan'].includes(norm)) flagKey = 'taiwan';
  else if (['br', 'brazil'].includes(norm)) flagKey = 'brazil';
  else if (['ar', 'middle_east', 'me', 'sa', 'saudi'].includes(norm)) flagKey = 'middle_east';
  else if (['hi', 'in', 'india'].includes(norm)) flagKey = 'india';
  else if (['id', 'indonesia'].includes(norm)) flagKey = 'indonesia';
  else if (['th', 'thailand'].includes(norm)) flagKey = 'thailand';
  else if (['vi', 'vietnam'].includes(norm)) flagKey = 'vietnam';

  // コンテナスタイル
  const containerStyle = [
    styles.flagContainer,
    { width: size, height: size, borderRadius: size / 2 },
    style,
  ];

  // 各国旗のView構造を描画するヘルパー
  const renderFlagContent = () => {
    switch (flagKey) {
      case 'japan':
        return (
          <View
            style={[
              styles.full,
              { backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
            ]}
          >
            <View
              style={{
                width: size * 0.55,
                height: size * 0.55,
                borderRadius: (size * 0.55) / 2,
                backgroundColor: '#BC002D',
              }}
            />
          </View>
        );

      case 'korea':
        return (
          <View
            style={[
              styles.full,
              {
                backgroundColor: '#FFFFFF',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              },
            ]}
          >
            {/* 太極図の簡易版（赤と青の半円の組み合わせ） */}
            <View
              style={{
                width: size * 0.48,
                height: size * 0.48,
                borderRadius: (size * 0.48) / 2,
                backgroundColor: '#C60C30',
                overflow: 'hidden',
                justifyContent: 'flex-end',
                transform: [{ rotate: '-30deg' }],
              }}
            >
              <View style={{ width: '100%', height: '50%', backgroundColor: '#0047A0' }} />
            </View>
            {/* 四隅の卦（簡易的な黒いドット） */}
            <View
              style={{
                position: 'absolute',
                top: '15%',
                left: '15%',
                width: 2,
                height: 2,
                backgroundColor: '#000',
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: '15%',
                right: '15%',
                width: 2,
                height: 2,
                backgroundColor: '#000',
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '15%',
                right: '15%',
                width: 2,
                height: 2,
                backgroundColor: '#000',
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: '15%',
                left: '15%',
                width: 2,
                height: 2,
                backgroundColor: '#000',
              }}
            />
          </View>
        );

      case 'usa':
        return (
          <View style={[styles.full, { backgroundColor: '#FFFFFF', position: 'relative' }]}>
            {/* 赤白ストライプ */}
            <View style={{ flex: 1, flexDirection: 'column' }}>
              {[...Array(7)].map((_, i) => (
                <View
                  key={i}
                  style={{ flex: 1, backgroundColor: i % 2 === 0 ? '#B22234' : '#FFFFFF' }}
                />
              ))}
            </View>
            {/* 左上の青ブロック */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '50%',
                height: '55%',
                backgroundColor: '#3C3B6E',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* 星の表現（白ドット） */}
              <View style={{ flexDirection: 'row', gap: 2 }}>
                <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: '#FFF' }} />
                <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: '#FFF' }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: '#FFF' }} />
                <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: '#FFF' }} />
              </View>
            </View>
          </View>
        );

      case 'europe':
        return (
          <View
            style={[
              styles.full,
              {
                backgroundColor: '#003399',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              },
            ]}
          >
            {/* 黄色の星の環（簡易版：黄色の極小円で輪を描く） */}
            <View
              style={{
                width: size * 0.6,
                height: size * 0.6,
                borderRadius: (size * 0.6) / 2,
                borderWidth: 1.5,
                borderColor: '#FFCC00',
                borderStyle: 'dashed',
              }}
            />
          </View>
        );

      case 'france':
        return (
          <View style={[styles.full, { flexDirection: 'row' }]}>
            <View style={{ flex: 1, backgroundColor: '#002395' }} />
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
            <View style={{ flex: 1, backgroundColor: '#ED2939' }} />
          </View>
        );

      case 'germany':
        return (
          <View style={[styles.full, { flexDirection: 'column' }]}>
            <View style={{ flex: 1, backgroundColor: '#000000' }} />
            <View style={{ flex: 1, backgroundColor: '#DD0000' }} />
            <View style={{ flex: 1, backgroundColor: '#FFCE00' }} />
          </View>
        );

      case 'italy':
        return (
          <View style={[styles.full, { flexDirection: 'row' }]}>
            <View style={{ flex: 1, backgroundColor: '#009246' }} />
            <View style={{ flex: 1, backgroundColor: '#F1F2F1' }} />
            <View style={{ flex: 1, backgroundColor: '#CE2B37' }} />
          </View>
        );

      case 'spain':
        return (
          <View style={[styles.full, { flexDirection: 'column' }]}>
            <View style={{ flex: 1, backgroundColor: '#AA151B' }} />
            <View
              style={{
                flex: 2,
                backgroundColor: '#F1BF00',
                justifyContent: 'center',
                paddingLeft: 3,
              }}
            >
              {/* 簡易的な紋章（赤い小さなドット） */}
              <View
                style={{
                  width: size * 0.2,
                  height: size * 0.25,
                  backgroundColor: '#AA151B',
                  borderRadius: 1,
                }}
              />
            </View>
            <View style={{ flex: 1, backgroundColor: '#AA151B' }} />
          </View>
        );

      case 'russia':
        return (
          <View style={[styles.full, { flexDirection: 'column' }]}>
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
            <View style={{ flex: 1, backgroundColor: '#0039A6' }} />
            <View style={{ flex: 1, backgroundColor: '#D52B1E' }} />
          </View>
        );

      case 'portugal':
        return (
          <View style={[styles.full, { flexDirection: 'row', position: 'relative' }]}>
            <View style={{ flex: 2, backgroundColor: '#006600' }} />
            <View style={{ flex: 3, backgroundColor: '#FF0000' }} />
            {/* 国章（簡易的な黄色丸） */}
            <View
              style={{
                position: 'absolute',
                left: '25%',
                top: '25%',
                width: size * 0.3,
                height: size * 0.3,
                borderRadius: (size * 0.3) / 2,
                backgroundColor: '#FFCC00',
                borderWidth: 1,
                borderColor: '#002395',
              }}
            />
          </View>
        );

      case 'china':
        return (
          <View style={[styles.full, { backgroundColor: '#EE1C25', position: 'relative' }]}>
            {/* 左上の大きい星（簡易黄色四角/丸） */}
            <View
              style={{
                position: 'absolute',
                top: '15%',
                left: '15%',
                width: size * 0.22,
                height: size * 0.22,
                borderRadius: 1,
                backgroundColor: '#FFFF00',
                transform: [{ rotate: '15deg' }],
              }}
            />
            {/* 周囲の小星（簡易黄色ドット） */}
            <View
              style={{
                position: 'absolute',
                top: '8%',
                left: '42%',
                width: 2,
                height: 2,
                backgroundColor: '#FFFF00',
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '22%',
                left: '50%',
                width: 2,
                height: 2,
                backgroundColor: '#FFFF00',
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '38%',
                left: '46%',
                width: 2,
                height: 2,
                backgroundColor: '#FFFF00',
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '48%',
                left: '34%',
                width: 2,
                height: 2,
                backgroundColor: '#FFFF00',
              }}
            />
          </View>
        );

      case 'taiwan':
        return (
          <View style={[styles.full, { backgroundColor: '#FE0000', position: 'relative' }]}>
            {/* 左上の青地 */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '50%',
                height: '50%',
                backgroundColor: '#000095',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* 白い太陽の簡易版 */}
              <View
                style={{
                  width: size * 0.22,
                  height: size * 0.22,
                  borderRadius: (size * 0.22) / 2,
                  backgroundColor: '#FFFFFF',
                }}
              />
            </View>
          </View>
        );

      case 'brazil':
        return (
          <View
            style={[
              styles.full,
              {
                backgroundColor: '#009739',
                justifyContent: 'center',
                alignItems: 'center',
                padding: size * 0.1,
              },
            ]}
          >
            {/* 黄色いひし形 */}
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#FFDF00',
                transform: [{ rotate: '45deg' }],
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* 中央の青い円 */}
              <View
                style={{
                  width: '65%',
                  height: '65%',
                  borderRadius: 999,
                  backgroundColor: '#002776',
                  transform: [{ rotate: '-45deg' }],
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {/* 白い帯（簡易白ライン） */}
                <View
                  style={{
                    width: '110%',
                    height: 1.5,
                    backgroundColor: '#FFFFFF',
                    transform: [{ rotate: '-15deg' }],
                  }}
                />
              </View>
            </View>
          </View>
        );

      case 'middle_east':
        return (
          <View
            style={[
              styles.full,
              {
                backgroundColor: '#006C35',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              },
            ]}
          >
            {/* 三日月と星のアラビックマーク（簡易白円と緑円によるクリップ） */}
            <View
              style={{
                width: size * 0.45,
                height: size * 0.45,
                borderRadius: (size * 0.45) / 2,
                backgroundColor: '#FFFFFF',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: -1,
                  right: -3,
                  width: size * 0.45,
                  height: size * 0.45,
                  borderRadius: (size * 0.45) / 2,
                  backgroundColor: '#006C35',
                }}
              />
            </View>
            {/* 小さな星 */}
            <View
              style={{
                position: 'absolute',
                right: '25%',
                top: '40%',
                width: 2,
                height: 2,
                backgroundColor: '#FFFFFF',
              }}
            />
          </View>
        );

      case 'india':
        return (
          <View style={[styles.full, { flexDirection: 'column' }]}>
            <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
            <View
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* アショカ・チャクラの簡易版（青い丸） */}
              <View
                style={{
                  width: size * 0.22,
                  height: size * 0.22,
                  borderRadius: (size * 0.22) / 2,
                  borderWidth: 1,
                  borderColor: '#000080',
                }}
              />
            </View>
            <View style={{ flex: 1, backgroundColor: '#138808' }} />
          </View>
        );

      case 'indonesia':
        return (
          <View style={[styles.full, { flexDirection: 'column' }]}>
            <View style={{ flex: 1, backgroundColor: '#ED2939' }} />
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
          </View>
        );

      case 'thailand':
        return (
          <View style={[styles.full, { flexDirection: 'column' }]}>
            <View style={{ flex: 1, backgroundColor: '#A51931' }} />
            <View style={{ flex: 1, backgroundColor: '#F4F5F8' }} />
            <View style={{ flex: 2, backgroundColor: '#2D2A4A' }} />
            <View style={{ flex: 1, backgroundColor: '#F4F5F8' }} />
            <View style={{ flex: 1, backgroundColor: '#A51931' }} />
          </View>
        );

      case 'vietnam':
        return (
          <View
            style={[
              styles.full,
              { backgroundColor: '#DA251D', justifyContent: 'center', alignItems: 'center' },
            ]}
          >
            {/* 中央の金色の星（簡易黄色十字/丸） */}
            <View
              style={{
                width: size * 0.4,
                height: size * 0.4,
                borderRadius: 2,
                backgroundColor: '#FFFF00',
              }}
            />
          </View>
        );

      default:
        // 不明なコードの場合は、地球儀風のアバターを表示
        return (
          <View
            style={[
              styles.full,
              { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
            ]}
          >
            <Text style={{ fontSize: size * 0.5, color: '#64748B', fontWeight: 'bold' }}>
              {flagKey.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        );
    }
  };

  return <View style={containerStyle}>{renderFlagContent()}</View>;
}

const styles = StyleSheet.create({
  flagContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  full: {
    width: '100%',
    height: '100%',
  },
});
