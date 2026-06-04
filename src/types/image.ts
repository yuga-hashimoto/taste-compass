// src/types/image.ts - 拡張画像メタデータ型定義

/** スタイルグループ */
export type StyleGroup =
  | 'natural' // ナチュラル・清楚
  | 'korean' // 韓国風トレンド
  | 'cool' // クール・都会派
  | 'casual' // カジュアル
  | 'feminine' // フェミニン
  | 'mature' // 大人・エレガント
  | 'office' // オフィス・知的
  | 'simple' // シンプル
  | 'gyaru' // ギャル系
  | 'cute' // 可愛い系・アイドル
  | 'sexy' // セクシー系
  | 'sporty' // スポーツ・ヘルシー
  | 'elegant' // 上品・クラシック
  | 'mode' // モード系
  | 'global_elegant'; // グローバル洗練

/** 地域・人種スタイル */
export type RegionalStyle =
  | 'japanese_style'
  | 'korean_style'
  | 'chinese_style'
  | 'western_style'
  | 'southeast_asian_style'
  | 'south_asian_style'
  | 'latina_style'
  | 'black_style'
  | 'middle_eastern_style'
  | 'global_mixed';

/** 体型シルエット */
export type Silhouette =
  | 'slim' // スリム
  | 'balanced' // バランス型
  | 'healthy' // ヘルシー
  | 'curvy' // グラマラス
  | 'soft' // ふんわり
  | 'petite' // 小柄
  | 'tall'; // 高身長

/** 胸の印象 */
export type BustImpression =
  | 'subtle' // すっきり
  | 'average' // 普通
  | 'full' // 豊か
  | 'very_full'; // とても豊か

/** お尻の印象 */
export type ButtImpression =
  | 'flat' // フラット
  | 'average' // 普通
  | 'round' // 丸み
  | 'full'; // ボリューム

/** 身長感 */
export type HeightImpression =
  | 'petite' // 小柄（155cm以下）
  | 'average' // 普通（155〜165cm）
  | 'tall'; // 高身長（165cm以上）

/** 年齢感 */
export type AgeImpression =
  | 'teens' // 10代後半
  | 'early20s' // 20〜23歳
  | 'mid20s' // 24〜27歳
  | 'late20s' // 28〜32歳
  | 'thirties' // 33〜39歳
  | 'forties'; // 40代

/** 雰囲気タイプ */
export type VibeType =
  | 'cute' // 可愛い
  | 'cool' // クール
  | 'sexy' // セクシー
  | 'pure' // 清楚・純粋
  | 'sporty' // スポーティ
  | 'intellectual' // 知的
  | 'gyaru' // ギャル
  | 'elegant' // 上品
  | 'natural' // ナチュラル
  | 'charismatic'; // カリスマ的

/** 髪型 */
export type HairStyle =
  | 'long_straight' // ストレートロング
  | 'long_wave' // ウェーブロング
  | 'medium' // ミディアム
  | 'bob' // ボブ
  | 'short' // ショート
  | 'pony' // ポニーテール
  | 'twin' // ツインテール
  | 'updo' // アップスタイル
  | 'curly'; // カーリー

/** 肌の色 */
export type SkinTone =
  | 'fair' // 白め
  | 'medium' // 標準
  | 'tan' // 小麦色
  | 'dark'; // ダーク

/** メイク強度 */
export type MakeupLevel =
  | 'natural' // 薄め・ナチュラル
  | 'moderate' // 普通
  | 'heavy' // しっかり
  | 'gyaru'; // ギャルメイク

/**
 * 拡張画像メタデータ型
 * src/services/scoringService.ts の ImageMetadata を継承・置換
 */
export interface ImageMetadata {
  id: string;
  image_url: string;

  // --- スタイル系 ---
  style_group: StyleGroup;
  regional_style: RegionalStyle | null;
  vibe_type: VibeType | null;

  // --- 体型系 ---
  body_silhouette: Silhouette | null;
  bust_impression: BustImpression | null;
  butt_impression: ButtImpression | null;
  height_impression: HeightImpression | null;

  // --- 外見系 ---
  age_impression: AgeImpression | null;
  hair_style: HairStyle | null;
  skin_tone: SkinTone | null;
  makeup_level: MakeupLevel | null;

  // --- タグ・スコア ---
  tags: string[];
  popularity_score: number; // 初期seed値 0〜100（静的）
  like_rate?: number; // 実投票から計算した動的値
  total_votes?: number; // 総投票数
}
