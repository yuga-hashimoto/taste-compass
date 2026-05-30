// voteService.ts - 投票送信サービス（localStorage集計付き）
import { supabase } from '../lib/supabase';
import { getPlatform } from '../lib/platform';
import { ENV } from '../lib/env';
import { incrementImageStat } from './imageStatsService';

export interface VotePayload {
  anonymous_user_id: string;
  session_id: string;
  image_id: string;
  vote_type: 'like' | 'skip';
}

/**
 * 投票をDBとlocalStorageの両方に記録する
 * - Supabase: votes テーブルに永続化（ユーザー間の世間スコアに使われる）
 * - localStorage: image_vote_stats に即時集計（オフライン・モック時でも機能）
 */
export const saveVote = async (payload: VotePayload): Promise<boolean> => {
  // 1. localStorage の集計に即時反映（常に実行）
  await incrementImageStat(payload.image_id, payload.vote_type);

  // 2. Supabase に永続化（接続がある場合のみ）
  try {
    if (!ENV.IS_MOCK) {
      const { error } = await supabase.from('votes').insert({
        anonymous_user_id: payload.anonymous_user_id,
        session_id: payload.session_id,
        image_id: payload.image_id,
        vote_type: payload.vote_type,
        platform: getPlatform(),
      });

      if (error) {
        console.error('Supabase saveVote error:', error.message);
        // Supabase失敗でもlocalStorageには記録済みなのでtrueを返す
      }
    }
    return true;
  } catch (error) {
    console.warn('Network issue, saveVote skipped server sync:', error);
    return true;
  }
};
