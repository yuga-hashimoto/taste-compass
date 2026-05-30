// platform.ts - プラットフォーム判別とレイアウトユーティリティ
import { Platform, Dimensions } from 'react-native';

export type PlatformType = 'web' | 'ios' | 'android';

export const getPlatform = (): PlatformType => {
  if (Platform.OS === 'web') return 'web';
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
};

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// レスポンシブ用のレイアウト設計
const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

export const LAYOUT = {
  windowWidth,
  windowHeight,
  isTablet: windowWidth >= 768,
  // Webブラウザでコンテンツを中央寄せにする最大幅 (スマホの縦長画面に合わせる)
  maxContentWidth: 480,
};
