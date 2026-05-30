// src/services/imageStatsService.ts
// 各画像への投票集計をlocalStorageで管理する。
// Supabaseがなくても「擬似的な世間スコア」として機能する。
// Supabase接続時はサーバー集計とマージして精度を高める。

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { ENV } from '../lib/env';

export const IMAGE_STATS_KEY = 'taste_compass_image_stats';

export interface ImageStat {
  likes: number;
  skips: number;
  total: number;
  like_rate: number; // likes / total * 100
  last_updated: string;
}

export type ImageStatsMap = Record<string, ImageStat>;

/**
 * ローカルの集計データを全件取得
 */
export const getLocalImageStats = async (): Promise<ImageStatsMap> => {
  try {
    const raw = await AsyncStorage.getItem(IMAGE_STATS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ImageStatsMap;
  } catch {
    return {};
  }
};

/**
 * 1枚の画像への投票を集計に加算する
 */
export const incrementImageStat = async (
  imageId: string,
  voteType: 'like' | 'skip',
): Promise<void> => {
  try {
    const stats = await getLocalImageStats();
    const current = stats[imageId] ?? { likes: 0, skips: 0, total: 0, like_rate: 50, last_updated: '' };

    const likes = current.likes + (voteType === 'like' ? 1 : 0);
    const skips = current.skips + (voteType === 'skip' ? 1 : 0);
    const total = likes + skips;
    const like_rate = total > 0 ? Math.round((likes / total) * 100) : 50;

    stats[imageId] = {
      likes,
      skips,
      total,
      like_rate,
      last_updated: new Date().toISOString(),
    };

    await AsyncStorage.setItem(IMAGE_STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn('imageStatsService: failed to increment stat', err);
  }
};

/**
 * Supabaseのimage_statsビューから全画像の集計を取得し、
 * ローカル集計とマージして返す（Supabaseが優先）
 *
 * 将来Supabaseに以下のビューを作成することで精度が上がる：
 * CREATE VIEW image_stats AS
 *   SELECT image_id,
 *     COUNT(*) FILTER (WHERE vote_type='like') AS likes,
 *     COUNT(*) FILTER (WHERE vote_type='skip') AS skips,
 *     COUNT(*) AS total,
 *     ROUND(COUNT(*) FILTER (WHERE vote_type='like') * 100.0 / NULLIF(COUNT(*),0)) AS like_rate
 *   FROM votes GROUP BY image_id;
 */
export const getMergedImageStats = async (): Promise<ImageStatsMap> => {
  const localStats = await getLocalImageStats();

  if (ENV.IS_MOCK) return localStats;

  try {
    const { data, error } = await supabase
      .from('image_stats')
      .select('image_id, likes, skips, total, like_rate');

    if (error || !data) return localStats;

    const merged: ImageStatsMap = { ...localStats };
    for (const row of data as any[]) {
      // Supabase集計が十分なデータ（10票以上）であれば優先
      if (row.total >= 10) {
        merged[row.image_id] = {
          likes: row.likes,
          skips: row.skips,
          total: row.total,
          like_rate: row.like_rate,
          last_updated: new Date().toISOString(),
        };
      } else if (!merged[row.image_id]) {
        // ローカルになければSupabase値を使う
        merged[row.image_id] = {
          likes: row.likes,
          skips: row.skips,
          total: row.total,
          like_rate: row.like_rate,
          last_updated: new Date().toISOString(),
        };
      }
    }
    return merged;
  } catch {
    return localStats;
  }
};
