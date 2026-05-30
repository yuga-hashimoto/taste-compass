// AdSlot.tsx - 広告表示コンポーネント (抽象化)
import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { ENV } from '../../lib/env';
import { THEME } from '../../theme/theme';

interface AdSlotProps {
  placement: 'home_bottom' | 'result_bottom' | 'history_bottom' | 'stats_bottom';
}

export const AdSlot: React.FC<AdSlotProps> = ({ placement }) => {
  // 広告機能自体が無効化されている場合は表示しない
  if (!ENV.ENABLE_ADS) {
    return null;
  }

  // Webとネイティブでの広告実装出し分けの骨組み
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container} testID={`ad-slot-${placement}`}>
        <View style={styles.adFrame}>
          <Text style={styles.adLabel}>SPONSOR AD</Text>
          <Text style={styles.adSub}>将来的にここにGoogle AdSenseなどの広告が配信されます</Text>
        </View>
      </View>
    );
  }

  // ネイティブ (iOS / Android) 用
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
  container: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adFrame: {
    width: '100%',
    maxWidth: 320,
    height: 100, // 標準的なラージバナーサイズ
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
});
