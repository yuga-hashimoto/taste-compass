// resultService.ts - 診断結果サービス
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { ScoringResult } from './scoringService';
import { ENV } from '../lib/env';

const HISTORY_STORAGE_KEY = 'taste_compass_diagnosis_history';

export interface DiagnosisResultItem {
  id: string; // uuid
  anonymous_user_id: string;
  session_id: string;
  compatibility_score: number;
  preference_type: string;
  preference_type_emoji?: string; // 診断タイプアイコンキー
  mainstream_score: number;
  uniqueness_score: number;
  summary_json: any;
  created_at: string;
  // 拡張データ (summary_json 内に格納されるが、ランタイムマッピング用に定義)
  country_affinity?: any;
  body_preference?: any;
  age_preference?: any;
  vibe_preference?: any;
  rarity?: any;
  meters?: any;
}

const normalizeResultItem = (item: DiagnosisResultItem): DiagnosisResultItem => ({
  ...item,
  preference_type_emoji: item.preference_type_emoji || item.summary_json?.preference_type_emoji,
});

/**
 * 診断結果を保存する (Supabase & ローカルの AsyncStorage)
 */
export const saveDiagnosisResult = async (
  anonymousUserId: string,
  sessionId: string,
  scoringResult: ScoringResult,
): Promise<DiagnosisResultItem | null> => {
  const resultData = {
    anonymous_user_id: anonymousUserId,
    session_id: sessionId,
    compatibility_score: scoringResult.compatibility_score,
    preference_type: scoringResult.preference_type,
    mainstream_score: scoringResult.mainstream_score,
    uniqueness_score: scoringResult.uniqueness_score,
    summary_json: {
      ...scoringResult.summary_json,
      preference_type_emoji: scoringResult.preference_type_emoji,
      country_affinity: scoringResult.country_affinity,
      body_preference: scoringResult.body_preference,
      age_preference: scoringResult.age_preference,
      vibe_preference: scoringResult.vibe_preference,
      rarity: scoringResult.rarity,
      meters: scoringResult.meters,
    },
  };

  let savedItem: DiagnosisResultItem | null = null;

  try {
    if (!ENV.IS_MOCK) {
      // 1. Supabaseへ書き込み
      const { data, error } = await supabase.from('results').insert(resultData).select().single();

      if (error) {
        console.warn('Supabase saveResult skipped (local fallback mode):', error.message);
      } else if (data) {
        savedItem = normalizeResultItem({
          ...(data as DiagnosisResultItem),
          preference_type_emoji:
            (data as DiagnosisResultItem).preference_type_emoji ||
            scoringResult.preference_type_emoji,
        });
      }
    }
  } catch (error) {
    console.warn('Network issue, failed to save result to Supabase:', error);
  }

  // Supabase保存に失敗した場合、またはオフライン時のためのローカルフォールバック用レコード作成
  if (!savedItem) {
    savedItem = {
      id: 'local_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now(),
      created_at: new Date().toISOString(),
      preference_type_emoji: scoringResult.preference_type_emoji,
      ...resultData,
    };
  }

  // 2. ローカルストレージにマージ保存
  try {
    const localHistoryRaw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    const localHistoryList: DiagnosisResultItem[] = localHistoryRaw
      ? JSON.parse(localHistoryRaw)
      : [];

    // 重複チェックして追加
    if (!localHistoryList.some((item) => item.session_id === savedItem!.session_id)) {
      const updatedList = [savedItem, ...localHistoryList];
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedList));
    }
  } catch (err) {
    console.error('Failed to save result to local storage:', err);
  }

  return savedItem;
};

/**
 * ユーザーの診断履歴を取得する (ローカルとSupabaseのデータをマージ・整合)
 */
export const getDiagnosisHistory = async (
  anonymousUserId: string,
): Promise<DiagnosisResultItem[]> => {
  let localList: DiagnosisResultItem[] = [];
  let serverList: DiagnosisResultItem[] = [];

  // 1. ローカル履歴を取得
  try {
    const localRaw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (localRaw) {
      localList = JSON.parse(localRaw);
    }
  } catch (err) {
    console.error('Failed to get local history:', err);
  }

  // 2. Supabaseから履歴を取得
  try {
    if (!ENV.IS_MOCK) {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('anonymous_user_id', anonymousUserId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        serverList = (data as DiagnosisResultItem[]).map(normalizeResultItem);
      }
    }
  } catch (err) {
    console.warn('Network issue, failed to get history from Supabase:', err);
  }

  // 3. ローカルとサーバーのデータをマージ (session_id でユニーク化)
  const mergedMap = new Map<string, DiagnosisResultItem>();

  // ローカルデータを先に入れる (IDがローカル一時IDになっている可能性のあるものも考慮)
  localList.forEach((item) => mergedMap.set(item.session_id, item));

  // サーバーの正式データで上書き/追加
  serverList.forEach((item) => mergedMap.set(item.session_id, item));

  // 配列に戻し、日付降順でソート
  const sortedMergedList = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  // 4. 最新の状態をローカルにキャッシュ書き戻し
  try {
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sortedMergedList));
  } catch (err) {
    console.error('Failed to cache synced history list:', err);
  }

  return sortedMergedList;
};

/**
 * 特定のセッション結果を取得
 */
export const getDiagnosisResultBySession = async (
  sessionId: string,
  anonymousUserId: string,
): Promise<DiagnosisResultItem | null> => {
  // まずローカルキャッシュから探す
  try {
    const localRaw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (localRaw) {
      const localList: DiagnosisResultItem[] = JSON.parse(localRaw);
      const cached = localList.find((item) => item.session_id === sessionId);
      if (cached) return normalizeResultItem(cached);
    }
  } catch (err) {
    console.error('Failed to search result in local cache:', err);
  }

  // なければSupabaseから取得
  try {
    if (!ENV.IS_MOCK) {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('session_id', sessionId)
        .eq('anonymous_user_id', anonymousUserId)
        .maybeSingle();

      if (!error && data) {
        return normalizeResultItem(data as DiagnosisResultItem);
      }
    }
  } catch (err) {
    console.warn('Failed to query single result from Supabase:', err);
  }

  return null;
};

/**
 * ユーザーの全履歴データを削除する
 */
export const deleteUserHistory = async (anonymousUserId: string): Promise<boolean> => {
  try {
    // 1. ローカルストレージをクリア
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);

    if (!ENV.IS_MOCK) {
      // 2. Supabaseから削除 (匿名ユーザーであるため、自身の anonymous_user_id のデータのみ削除)
      // カスケードにより results や sessions も消える設計だが、念のため results も明示的に消す
      const { error: resultErr } = await supabase
        .from('results')
        .delete()
        .eq('anonymous_user_id', anonymousUserId);

      const { error: sessionErr } = await supabase
        .from('diagnosis_sessions')
        .delete()
        .eq('anonymous_user_id', anonymousUserId);

      const { error: voteErr } = await supabase
        .from('votes')
        .delete()
        .eq('anonymous_user_id', anonymousUserId);

      if (resultErr || sessionErr || voteErr) {
        console.warn('Error clearing data on Supabase (local cleared):', {
          resultErr,
          sessionErr,
          voteErr,
        });
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to delete user history:', error);
    return false;
  }
};
