import { Platform } from 'react-native';

const checkQueryMock = (): boolean => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    try {
      return window.location.search.includes('mock=true');
    } catch {
      return false;
    }
  }
  return false;
};

export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  ENABLE_ADS: process.env.EXPO_PUBLIC_ENABLE_ADS === 'true', // 広告機能の有効化フラグ
  IS_MOCK:
    checkQueryMock() ||
    (process.env.JEST_WORKER_ID === undefined &&
      (!process.env.EXPO_PUBLIC_SUPABASE_URL ||
        process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder') ||
        process.env.EXPO_PUBLIC_SUPABASE_URL.includes('test.supabase.co') ||
        process.env.EXPO_PUBLIC_SUPABASE_URL.includes('dummy'))),
};

// 起動時に環境変数がプレースホルダーの場合、警告を表示（本番環境でのミス防止）
if (
  __DEV__ &&
  !checkQueryMock() &&
  (ENV.SUPABASE_URL.includes('placeholder') || ENV.SUPABASE_ANON_KEY.includes('placeholder'))
) {
  console.warn(
    '⚠️ Supabaseの環境変数が設定されていません。.env ファイルを確認してください。現在はプレースホルダーで動作しています。',
  );
}
