// anonymousUser.ts - 匿名ユーザーIDの管理
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANONYMOUS_USER_ID_KEY = 'taste_compass_anonymous_user_id';

/**
 * 簡易的な UUID v4 生成器
 * 外部ライブラリ依存を減らし、Web/ネイティブ双方で確実に動くように実装
 */
export const generateUUID = (): string => {
  // Webブラウザの標準cryptoが使える場合
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    try {
      return window.crypto.randomUUID();
    } catch {
      // フォールバック
    }
  }

  // 標準的なフォールバック生成アルゴリズム
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * 保存されている匿名IDを取得する。
 * なければ新規生成して保存する。
 */
export const getOrCreateAnonymousUserId = async (): Promise<string> => {
  try {
    const storedId = await AsyncStorage.getItem(ANONYMOUS_USER_ID_KEY);
    if (storedId) {
      return storedId;
    }
    const newId = generateUUID();
    await AsyncStorage.setItem(ANONYMOUS_USER_ID_KEY, newId);
    return newId;
  } catch (error) {
    console.error('Failed to get or create anonymous user ID:', error);
    // AsyncStorageに保存できなかった場合はメモリ上の一時IDを返す
    return generateUUID();
  }
};

/**
 * 匿名IDを再生成する (設定画面でのデータ削除/匿名ID再生成時用)
 */
export const regenerateAnonymousUserId = async (): Promise<string> => {
  try {
    const newId = generateUUID();
    await AsyncStorage.setItem(ANONYMOUS_USER_ID_KEY, newId);
    return newId;
  } catch (error) {
    console.error('Failed to regenerate anonymous user ID:', error);
    return generateUUID();
  }
};

/**
 * 匿名IDを削除する (AsyncStorageから削除)
 */
export const removeAnonymousUserId = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ANONYMOUS_USER_ID_KEY);
  } catch (error) {
    console.error('Failed to remove anonymous user ID:', error);
  }
};
