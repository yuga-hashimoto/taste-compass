import { supabase } from '../lib/supabase';
import { getPlatform } from '../lib/platform';
import { ENV } from '../lib/env';

export interface SessionPayload {
  id: string;
  anonymous_user_id: string;
  total_images: number;
}

/**
 * 診断セッションを開始する
 */
export const createSession = async (payload: SessionPayload): Promise<boolean> => {
  try {
    if (!ENV.IS_MOCK) {
      const { error } = await supabase.from('diagnosis_sessions').insert({
        id: payload.id,
        anonymous_user_id: payload.anonymous_user_id,
        status: 'active',
        total_images: payload.total_images,
        completed_count: 0,
        platform: getPlatform(),
      });

      if (error) {
        console.warn('Supabase createSession skipped (local fallback mode):', error.message);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.warn('Network issue, createSession fallback to local:', error);
    return true;
  }
};

/**
 * 診断セッションの進捗を更新する
 */
export const updateSessionProgress = async (
  sessionId: string,
  completedCount: number,
): Promise<boolean> => {
  try {
    if (!ENV.IS_MOCK) {
      const { error } = await supabase
        .from('diagnosis_sessions')
        .update({ completed_count: completedCount })
        .eq('id', sessionId);

      if (error) {
        console.warn(
          'Supabase updateSessionProgress skipped (local fallback mode):',
          error.message,
        );
        return false;
      }
    }
    return true;
  } catch (error) {
    console.warn('Network issue, updateSessionProgress skipped:', error);
    return true;
  }
};

/**
 * 診断セッションを完了状態にする
 */
export const completeSession = async (sessionId: string): Promise<boolean> => {
  try {
    if (!ENV.IS_MOCK) {
      const { error } = await supabase
        .from('diagnosis_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) {
        console.warn('Supabase completeSession skipped (local fallback mode):', error.message);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.warn('Network issue, completeSession skipped:', error);
    return true;
  }
};
