// eventService.ts - 匿名イベント送信サービス
import { supabase } from '../lib/supabase';
import { getPlatform } from '../lib/platform';
import { ENV } from '../lib/env';

export type AppEventName =
  | 'app_open'
  | 'diagnosis_start'
  | 'vote_like'
  | 'vote_skip'
  | 'diagnosis_complete'
  | 'result_share_click'
  | 'history_open'
  | 'report_submit'
  | 'data_delete';

/**
 * 匿名のアプリ利用イベントを記録する
 */
export const trackEvent = async (
  anonymousUserId: string | null,
  eventName: AppEventName,
  payload?: Record<string, any>,
): Promise<void> => {
  try {
    if (!ENV.IS_MOCK) {
      // 過剰なトラッキングは避け、匿名性を確保するためにPayloadは最小限に留める
      const { error } = await supabase.from('app_events').insert({
        anonymous_user_id: anonymousUserId,
        event_name: eventName,
        event_payload: payload || {},
        platform: getPlatform(),
      });

      if (error) {
        // ログ送信の失敗は、本質的なユーザー体験に影響を与えてはならないため、警告表示のみ行う
        if (__DEV__) {
          console.warn(`[Analytics Failed] event: ${eventName}`, error.message);
        }
      }
    }
  } catch {
    // catchして静かに無視する
  }
};
