// imageService.ts - 画像取得サービス（ローカル静的配信 + stats マージ版）
import { ImageMetadata } from '../types/image';
import { LOCAL_IMAGES } from '../data/imageMetadata';
import { getMergedImageStats } from './imageStatsService';

/**
 * 診断テーマに応じてフィルタリング
 */
const filterImagesByTheme = (images: ImageMetadata[], theme: string): ImageMetadata[] => {
  if (theme === 'all') return images;
  return images.filter((img) => {
    switch (theme) {
      case 'natural':  return img.style_group === 'natural' || img.style_group === 'simple';
      case 'cool':     return img.style_group === 'cool' || img.style_group === 'mode' || img.style_group === 'elegant';
      case 'global':   return img.regional_style === 'western_style' || img.regional_style === 'latina_style' || img.regional_style === 'black_style' || img.style_group === 'global_elegant';
      case 'mature':   return img.style_group === 'mature' || img.style_group === 'office' || img.style_group === 'elegant';
      case 'casual':   return img.style_group === 'casual' || img.style_group === 'sporty';
      case 'cute':     return img.style_group === 'cute' || img.style_group === 'feminine';
      case 'sexy':     return img.style_group === 'sexy' || img.style_group === 'gyaru';
      case 'korean':   return img.style_group === 'korean' || img.regional_style === 'korean_style';
      default:         return true;
    }
  });
};

/**
 * 診断用画像リストを取得する
 * - ローカルメタデータをソースとして使用（Supabase Storage 不使用）
 * - localStorage から蓄積した投票統計をマージして like_rate を動的に更新
 *
 * @param theme 診断テーマ
 * @param limit 取得件数
 */
export const getDiagnosisImages = async (
  theme: string,
  limit: number,
): Promise<ImageMetadata[]> => {
  // 1. 蓄積された投票統計を取得（Supabase or localStorage）
  const stats = await getMergedImageStats();

  // 2. ローカルメタデータに動的 like_rate をマージ
  const allImages: ImageMetadata[] = LOCAL_IMAGES.map((img) => {
    const stat = stats[img.id];
    if (stat && stat.total >= 5) {
      // 5票以上蓄積されていれば動的値を使用
      return { ...img, like_rate: stat.like_rate, total_votes: stat.total };
    }
    return img;
  });

  // 3. テーマでの絞り込み
  let filtered = filterImagesByTheme(allImages, theme);

  // 絞り込み結果が足りない場合は全体から補填
  if (filtered.length < limit) {
    const fallback = allImages.filter((img) => !filtered.some((f) => f.id === img.id));
    filtered = [...filtered, ...fallback];
  }

  // 4. 枚数が足りない場合は複製してかさ増し（初期運用でも診断が破綻しない）
  let extended = [...filtered];
  while (extended.length < limit) {
    extended = [
      ...extended,
      ...filtered.map((img, idx) => ({
        ...img,
        id: `${img.id}_dup_${idx}_${Math.random().toString(36).slice(2, 7)}`,
      })),
    ];
  }

  // 5. シャッフルして limit 枚切り出す
  return extended.sort(() => Math.random() - 0.5).slice(0, limit);
};
