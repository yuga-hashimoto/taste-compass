// reportService.ts - 不適切報告送信サービス
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { ENV } from '../lib/env';

const LAST_REPORT_TIME_KEY = 'taste_compass_last_report_timestamp';
const REPORT_COOLDOWN_MS = 5000; // 5秒の送信クールダウン

export interface ReportPayload {
  anonymous_user_id: string;
  image_id?: string;
  report_type: 'inappropriate' | 'resemblance' | 'other';
  message: string;
}

/**
 * 画像またはコンテンツに対する報告を送信する
 */
export const submitReport = async (
  payload: ReportPayload,
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 簡易レート制限のチェック
    const now = Date.now();
    const lastReportRaw = await AsyncStorage.getItem(LAST_REPORT_TIME_KEY);
    if (lastReportRaw) {
      const lastReportTime = parseInt(lastReportRaw, 10);
      if (now - lastReportTime < REPORT_COOLDOWN_MS) {
        return {
          success: false,
          error: '前回の報告から時間が経っていません。しばらく待ってから再度送信してください。',
        };
      }
    }

    if (!ENV.IS_MOCK) {
      // 1. Supabaseへインサート
      const { error } = await supabase.from('reports').insert({
        anonymous_user_id: payload.anonymous_user_id,
        image_id: payload.image_id || null,
        report_type: payload.report_type,
        message: payload.message,
        status: 'open',
      });

      if (error) {
        console.error('Supabase submitReport error:', error.message);
        return { success: false, error: 'サーバーに保存できませんでした。' };
      }
    }

    // 最後の報告時間を保存
    await AsyncStorage.setItem(LAST_REPORT_TIME_KEY, now.toString());

    return { success: true };
  } catch (error) {
    console.error('submitReport exception:', error);
    return { success: false, error: '通信エラーが発生しました。' };
  }
};
