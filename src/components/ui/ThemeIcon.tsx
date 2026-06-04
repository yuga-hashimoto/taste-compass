// ThemeIcon.tsx - テーマ＆スタイル用ベクターアイコンコンポーネント
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { THEME } from '../../theme/theme';

interface ThemeIconProps {
  themeId: string; // 'all', 'natural', 'cool', 'cute', 'sexy', 'korean', 'global', 'mature', 'casual' 等
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function ThemeIcon({
  themeId,
  size = 18,
  color = THEME.colors.text,
  style,
}: ThemeIconProps) {
  const key = themeId.toLowerCase().trim();

  // マップ定義：(ライブラリ名, アイコン名)
  const getIconConfig = (): { lib: 'feather' | 'ionicons'; name: string } => {
    switch (key) {
      case 'all':
        return { lib: 'feather', name: 'compass' };
      case 'natural':
      case 'clean':
        return { lib: 'ionicons', name: 'leaf' };
      case 'cool':
      case 'mode':
        return { lib: 'feather', name: 'zap' };
      case 'cute':
      case 'feminine':
        return { lib: 'feather', name: 'heart' };
      case 'sexy':
        return { lib: 'ionicons', name: 'flame' };
      case 'korean':
        return { lib: 'ionicons', name: 'sparkles' };
      case 'global':
      case 'global_elegant':
        return { lib: 'feather', name: 'globe' };
      case 'mature':
      case 'elegant':
        return { lib: 'feather', name: 'award' };
      case 'casual':
      case 'sporty':
        return { lib: 'feather', name: 'smile' };
      case 'office':
      case 'intellectual':
        return { lib: 'feather', name: 'briefcase' };
      case 'simple':
        return { lib: 'feather', name: 'circle' };
      case 'gyaru':
        return { lib: 'feather', name: 'star' };
      case 'pure':
        return { lib: 'feather', name: 'sun' };
      case 'charismatic':
        return { lib: 'feather', name: 'shield' };
      default:
        return { lib: 'feather', name: 'star' };
    }
  };

  const config = getIconConfig();

  return (
    <View style={style}>
      {config.lib === 'feather' ? (
        <Feather name={config.name as any} size={size} color={color} />
      ) : (
        <Ionicons name={config.name as any} size={size} color={color} />
      )}
    </View>
  );
}
