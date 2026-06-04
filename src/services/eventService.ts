// eventService.ts - 匿名イベント送信サービス
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
  _anonymousUserId: string | null,
  eventName: AppEventName,
  payload?: Record<string, any>,
): Promise<void> => {
  // DB容量節約のため、Supabaseへのイベント送信は無効化し、開発ログ出力のみにします。
  if (__DEV__) {
    console.log(`[Event Tracked] ${eventName}`, payload || {});
  }
};
