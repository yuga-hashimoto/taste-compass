// scoringService.ts - 拡張診断スコアリングロジック
// 世界・国別比較、体型傾向、年齢傾向、レアリティ、メーター分析を含む

import { getCurrentLang } from '../i18n';
import { ImageMetadata } from '../types/image';
import { ImageStatsMap } from './imageStatsService';

export type { ImageMetadata };

export interface VoteData {
  image_id: string;
  vote_type: 'like' | 'skip';
}

// --- 国別好み傾向プロファイル（seed データ）---
// 各国の「典型的な好み」を数値化したベースライン
// 実データが蓄積されるにつれてこの値は動的データで上書きされる
interface CountryProfile {
  label: string;
  flag: string;
  style_weights: Record<string, number>;
  regional_weights: Record<string, number>;
  bust_weights: Record<string, number>;
  age_weights: Record<string, number>;
  vibe_weights: Record<string, number>;
}

const COUNTRY_PROFILES: Record<string, CountryProfile> = {
  japan: {
    label: '日本',
    flag: 'jp',
    style_weights: { natural: 30, korean: 25, cute: 20, feminine: 15, cool: 10 },
    regional_weights: { japanese_style: 40, korean_style: 35, global_mixed: 15, western_style: 10 },
    bust_weights: { subtle: 30, average: 45, full: 20, very_full: 5 },
    age_weights: { teens: 20, early20s: 40, mid20s: 30, late20s: 8, thirties: 2, forties: 0 },
    vibe_weights: { pure: 35, cute: 30, natural: 20, cool: 10, elegant: 5 },
  },
  korea: {
    label: '韓国',
    flag: 'kr',
    style_weights: { korean: 40, cool: 25, elegant: 20, natural: 10, cute: 5 },
    regional_weights: { korean_style: 60, western_style: 20, global_mixed: 15, japanese_style: 5 },
    bust_weights: { subtle: 40, average: 45, full: 12, very_full: 3 },
    age_weights: { teens: 10, early20s: 35, mid20s: 35, late20s: 15, thirties: 4, forties: 1 },
    vibe_weights: { cool: 35, elegant: 25, pure: 20, cute: 15, natural: 5 },
  },
  usa: {
    label: 'アメリカ',
    flag: 'us',
    style_weights: { casual: 30, sexy: 25, sporty: 20, cool: 15, feminine: 10 },
    regional_weights: { western_style: 50, latina_style: 20, black_style: 15, global_mixed: 15 },
    bust_weights: { very_full: 25, full: 35, average: 30, subtle: 10 },
    age_weights: { teens: 5, early20s: 20, mid20s: 35, late20s: 30, thirties: 8, forties: 2 },
    vibe_weights: { sexy: 30, sporty: 25, cool: 20, charismatic: 15, natural: 10 },
  },
  europe: {
    label: 'ヨーロッパ',
    flag: 'eu',
    style_weights: { elegant: 30, cool: 25, mode: 20, mature: 15, simple: 10 },
    regional_weights: { western_style: 60, global_mixed: 20, global_elegant: 15, latina_style: 5 },
    bust_weights: { average: 40, subtle: 30, full: 25, very_full: 5 },
    age_weights: { teens: 2, early20s: 15, mid20s: 30, late20s: 35, thirties: 15, forties: 3 },
    vibe_weights: { elegant: 35, cool: 30, intellectual: 20, natural: 10, charismatic: 5 },
  },
  china: {
    label: '中国',
    flag: 'cn',
    style_weights: { elegant: 30, natural: 25, mature: 20, cute: 15, korean: 10 },
    regional_weights: { chinese_style: 45, korean_style: 25, japanese_style: 20, western_style: 10 },
    bust_weights: { subtle: 35, average: 45, full: 15, very_full: 5 },
    age_weights: { teens: 15, early20s: 40, mid20s: 30, late20s: 10, thirties: 4, forties: 1 },
    vibe_weights: { elegant: 30, pure: 25, cute: 20, natural: 15, cool: 10 },
  },
  brazil: {
    label: 'ブラジル',
    flag: 'br',
    style_weights: { sexy: 40, casual: 25, sporty: 20, feminine: 10, gyaru: 5 },
    regional_weights: { latina_style: 60, western_style: 25, global_mixed: 15 },
    bust_weights: { very_full: 35, full: 40, average: 20, subtle: 5 },
    age_weights: { teens: 10, early20s: 30, mid20s: 35, late20s: 20, thirties: 4, forties: 1 },
    vibe_weights: { sexy: 40, sporty: 25, charismatic: 20, natural: 10, cute: 5 },
  },
  middle_east: {
    label: '中東',
    flag: 'me',
    style_weights: { elegant: 40, mature: 25, feminine: 20, natural: 10, cool: 5 },
    regional_weights: { middle_eastern_style: 50, western_style: 30, global_mixed: 20 },
    bust_weights: { average: 40, full: 30, subtle: 20, very_full: 10 },
    age_weights: { teens: 10, early20s: 30, mid20s: 30, late20s: 20, thirties: 8, forties: 2 },
    vibe_weights: { elegant: 40, charismatic: 25, pure: 20, intellectual: 10, cool: 5 },
  },
};

/** 内部タグのUI向け表現変換 */
export const translateInternalTag = (key: string, value: string | null): string => {
  if (!value) return '';

  const lang = getCurrentLang();
  const isJa = lang === 'ja';

  const mapsJa: Record<string, Record<string, string>> = {
    bust_impression: {
      very_full: 'とても豊かなシルエット',
      full: '柔らかいシルエット',
      average: 'バランスの良い印象',
      subtle: 'すっきりした印象',
    },
    butt_impression: {
      full: 'ボリュームのあるシルエット',
      round: '丸みのあるシルエット',
      average: '自然なシルエット',
      flat: 'スマートなシルエット',
    },
    body_silhouette: {
      curvy: '大人っぽいシルエット',
      slim: 'スマートなシルエット',
      healthy: '健康的なシルエット',
      balanced: '整ったバランス',
      soft: 'フェミニンなライン',
      petite: 'コンパクトで可愛らしい体型',
      tall: 'スラリとした高身長',
    },
    regional_style: {
      western_style: 'グローバル系の洗練感',
      korean_style: '韓国風トレンド感',
      japanese_style: '日本寄りのナチュラル感',
      chinese_style: '華やかで大人っぽい雰囲気',
      southeast_asian_style: '爽やかでアジアンな雰囲気',
      south_asian_style: 'エキゾチックで深みのあるテイスト',
      latina_style: 'ヘルシーでアクティブな輝き',
      middle_eastern_style: '上品でエキゾチックな魅力',
      black_style: '力強くエネルギッシュな存在感',
      global_mixed: 'グローバルな多様性',
    },
    age_impression: {
      teens: '10代後半',
      early20s: '20代前半',
      mid20s: '20代中盤',
      late20s: '20代後半〜30代前半',
      thirties: '30代',
      forties: '40代',
    },
    vibe_type: {
      cute: '可愛い系',
      cool: 'クール系',
      sexy: 'セクシー系',
      pure: '清楚・純粋系',
      sporty: 'スポーティ系',
      intellectual: '知的・インテリ系',
      gyaru: 'ギャル系',
      elegant: '上品・エレガント系',
      natural: 'ナチュラル系',
      charismatic: 'カリスマ・オーラ系',
    },
  };

  const mapsEn: Record<string, Record<string, string>> = {
    bust_impression: {
      very_full: 'very full silhouette',
      full: 'soft silhouette',
      average: 'well-balanced silhouette',
      subtle: 'slim silhouette',
    },
    butt_impression: {
      full: 'voluminous silhouette',
      round: 'curved silhouette',
      average: 'natural silhouette',
      flat: 'slim silhouette',
    },
    body_silhouette: {
      curvy: 'mature silhouette',
      slim: 'slim silhouette',
      healthy: 'healthy silhouette',
      balanced: 'well-balanced figure',
      soft: 'feminine lines',
      petite: 'petite & cute figure',
      tall: 'tall & slender figure',
    },
    regional_style: {
      western_style: 'Western sophistication',
      korean_style: 'Korean trend style',
      japanese_style: 'Japanese natural look',
      chinese_style: 'Glamorous & mature vibe',
      southeast_asian_style: 'Fresh Asian vibe',
      south_asian_style: 'Exotic & deep taste',
      latina_style: 'Healthy & active glow',
      middle_eastern_style: 'Elegant & exotic appeal',
      black_style: 'Strong & energetic presence',
      global_mixed: 'Global diversity',
    },
    age_impression: {
      teens: 'late teens',
      early20s: 'early 20s',
      mid20s: 'mid 20s',
      late20s: 'late 20s to early 30s',
      thirties: '30s',
      forties: '40s',
    },
    vibe_type: {
      cute: 'Cute',
      cool: 'Cool',
      sexy: 'Sexy',
      pure: 'Pure & Clean',
      sporty: 'Sporty',
      intellectual: 'Intellectual',
      gyaru: 'Gyaru',
      elegant: 'Elegant',
      natural: 'Natural',
      charismatic: 'Charismatic',
    },
  };

  const maps = isJa ? mapsJa : mapsEn;
  return maps[key]?.[value] ?? value;
};

// ランクにソートして上位を取る汎用ヘルパー
const topEntries = (counts: Record<string, number>, n = 3): string[] =>
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);

// 0〜100にクランプ
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

// ユーザープロファイルと国プロファイルの類似度を計算（コサイン類似度の簡易版）
const calcCountrySimilarity = (
  userWeights: Record<string, number>,
  countryWeights: Record<string, number>,
): number => {
  const allKeys = new Set([...Object.keys(userWeights), ...Object.keys(countryWeights)]);
  let dot = 0, normU = 0, normC = 0;
  for (const k of allKeys) {
    const u = userWeights[k] ?? 0;
    const c = countryWeights[k] ?? 0;
    dot += u * c;
    normU += u * u;
    normC += c * c;
  }
  if (normU === 0 || normC === 0) return 0;
  return Math.round((dot / (Math.sqrt(normU) * Math.sqrt(normC))) * 100);
};

export interface ScoringResult {
  // --- 基本スコア ---
  compatibility_score: number;    // 世間との一致度 0-100
  preference_type: string;        // 好みタイプ名（例: 「ナチュラル・清楚派」）
  preference_type_emoji: string;  // 絵文字
  mainstream_score: number;       // 一般受けスコア
  uniqueness_score: number;       // 個性スコア

  // --- 国別比較 ---
  country_affinity: {
    top_country: string;          // 最も好みが近い国キー
    top_country_label: string;    // 最も好みが近い国名
    top_country_flag: string;
    top_country_score: number;    // 一致度 %
    rankings: {
      country: string;
      label: string;
      flag: string;
      score: number;
    }[];
  };

  // --- 体型・外見傾向 ---
  body_preference: {
    bust_label: string;
    butt_label: string;
    height_label: string;
    silhouette_label: string;
    overall: string;
  };

  // --- 年齢傾向 ---
  age_preference: {
    top_age: string;
    label: string;
    description: string;
  };

  // --- 雰囲気傾向 ---
  vibe_preference: {
    top_vibe: string;
    label: string;
    score: number;
  };

  // --- レアリティ ---
  rarity: {
    label: string;
    icon: string;
    description: string;
    score: number;           // 好みのレア度 0-100（高いほどレア）
  };

  // --- 各種メーター ---
  meters: {
    gyaru_level: number;        // ギャル度 0-100
    pure_level: number;         // 清楚度 0-100
    global_level: number;       // グローバル好み度 0-100
    intellectual_level: number; // 知的好み度 0-100
    sexy_level: number;         // セクシー好み度 0-100
    mature_level: number;       // 大人っぽさ好み度 0-100
  };

  // --- 詳細サマリー（旧互換 + 拡張）---
  summary_json: {
    top_styles: string[];
    top_regional_styles: string[];
    top_tags: string[];
    silhouette_impression: string;
    focus_type: 'face' | 'atmosphere' | 'style' | 'body';
    style_analysis: string;
    country_analysis: string;
    body_analysis: string;
    age_analysis: string;
    rarity_analysis: string;
  };
}

/**
 * メインスコアリング関数
 */
export const calculateDiagnosisResult = (
  votes: VoteData[],
  images: ImageMetadata[],
  imageStats?: ImageStatsMap,
): ScoringResult => {
  const imageMap = new Map<string, ImageMetadata>();
  images.forEach((img) => imageMap.set(img.id, img));

  const likedImages: ImageMetadata[] = [];
  const skippedImages: ImageMetadata[] = [];

  votes.forEach((v) => {
    const img = imageMap.get(v.image_id);
    if (!img) return;
    if (v.vote_type === 'like') likedImages.push(img);
    else skippedImages.push(img);
  });

  // ==============================
  // 1. 世間との一致度 (compatibility_score)
  // ==============================
  let compatibilityScore = 50;
  if (votes.length > 0) {
    let total = 0, count = 0;
    let hasRealData = false;

    // 実データ（他のユーザーによる総投票数が1票以上のもの）が1つでもあるかチェック
    likedImages.forEach((img) => {
      const stat = imageStats?.[img.id];
      if (stat && stat.total > 0) {
        hasRealData = true;
      }
    });
    skippedImages.forEach((img) => {
      const stat = imageStats?.[img.id];
      if (stat && stat.total > 0) {
        hasRealData = true;
      }
    });

    if (hasRealData) {
      // 実データがある場合、実データが存在する画像のみを集計対象にする（フォールバックを排除）
      likedImages.forEach((img) => {
        const stat = imageStats?.[img.id];
        if (stat && stat.total > 0) {
          total += stat.like_rate;
          count++;
        }
      });
      skippedImages.forEach((img) => {
        const stat = imageStats?.[img.id];
        if (stat && stat.total > 0) {
          total += 100 - stat.like_rate;
          count++;
        }
      });
    } else {
      // 実データが1件もない場合は、初期の仮スコアでフォールバック
      likedImages.forEach((img) => {
        const rate = img.like_rate ?? img.popularity_score ?? 50;
        total += rate;
        count++;
      });
      skippedImages.forEach((img) => {
        const rate = img.like_rate ?? img.popularity_score ?? 50;
        total += 100 - rate; // スキップした画像は「世間がスキップする割合」との一致
        count++;
      });
    }

    if (count > 0) compatibilityScore = clamp(total / count);
  }

  const mainstreamScore = compatibilityScore;
  const uniquenessScore = 100 - mainstreamScore;

  // ==============================
  // 2. 集計カウント
  // ==============================
  const styleCounts: Record<string, number> = {};
  const regionalCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  const silhouetteCounts: Record<string, number> = {};
  const bustCounts: Record<string, number> = {};
  const buttCounts: Record<string, number> = {};
  const ageCounts: Record<string, number> = {};
  const vibeCounts: Record<string, number> = {};
  const hairCounts: Record<string, number> = {};
  const makeupCounts: Record<string, number> = {};

  likedImages.forEach((img) => {
    const inc = (obj: Record<string, number>, key: string | null | undefined) => {
      if (key) obj[key] = (obj[key] || 0) + 1;
    };
    inc(styleCounts, img.style_group);
    inc(regionalCounts, img.regional_style);
    inc(silhouetteCounts, img.body_silhouette);
    inc(bustCounts, img.bust_impression);
    inc(buttCounts, img.butt_impression);
    inc(ageCounts, img.age_impression);
    inc(vibeCounts, img.vibe_type);
    inc(hairCounts, img.hair_style);
    inc(makeupCounts, img.makeup_level);
    img.tags.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
  });

  // ==============================
  // 3. 好みタイプ決定
  // ==============================
  const topStyle = topEntries(styleCounts, 1)[0] || 'natural';
  const topVibe = topEntries(vibeCounts, 1)[0] || 'natural';
  const topAge = topEntries(ageCounts, 1)[0] || 'early20s';
  const topBust = topEntries(bustCounts, 1)[0] || 'average';
  const topButt = topEntries(buttCounts, 1)[0] || 'average';
  const topSilhouette = topEntries(silhouetteCounts, 1)[0] || 'balanced';
  const topRegional = topEntries(regionalCounts, 1)[0] || 'japanese_style';

  type PreferenceEntry = { label: string; icon: string };
  const preferenceMap: Record<string, PreferenceEntry> = {
    natural:       { label: 'ナチュラル・清楚派',   icon: 'natural' },
    korean:        { label: '韓国風トレンド派',     icon: 'korean' },
    cool:          { label: 'クール・都会派',       icon: 'cool' },
    casual:        { label: 'カジュアル親しみ派',   icon: 'casual' },
    feminine:      { label: '柔らかフェミニン派',   icon: 'feminine' },
    mature:        { label: '大人っぽい知的派',     icon: 'mature' },
    office:        { label: '知的オフィス派',       icon: 'office' },
    simple:        { label: 'シンプル洗練派',       icon: 'simple' },
    gyaru:         { label: 'ギャル・個性派',       icon: 'gyaru' },
    cute:          { label: '可愛い・アイドル派',   icon: 'cute' },
    sexy:          { label: 'セクシー・グラマー派', icon: 'sexy' },
    sporty:        { label: 'スポーティ・ヘルシー派', icon: 'sporty' },
    elegant:       { label: 'エレガント・上品派',   icon: 'elegant' },
    mode:          { label: 'モード・アーティスト派', icon: 'mode' },
    global_elegant:{ label: 'グローバル洗練派',    icon: 'global_elegant' },
  };
  const prefEntry = preferenceMap[topStyle] ?? { label: 'ナチュラル・清楚派', icon: 'natural' };

  // ==============================
  // 4. 国別類似度計算
  // ==============================
  // ユーザーの好みを各次元の割合ベクトルに変換
  const totalLikes = likedImages.length || 1;
  const toRatioMap = (counts: Record<string, number>): Record<string, number> => {
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(counts)) result[k] = (v / totalLikes) * 100;
    return result;
  };

  const userStyleRatio = toRatioMap(styleCounts);
  const userRegionalRatio = toRatioMap(regionalCounts);
  const userBustRatio = toRatioMap(bustCounts);
  const userAgeRatio = toRatioMap(ageCounts);
  const userVibeRatio = toRatioMap(vibeCounts);

  const countryScores: { country: string; label: string; flag: string; score: number }[] = [];
  for (const [countryKey, profile] of Object.entries(COUNTRY_PROFILES)) {
    const scores = [
      calcCountrySimilarity(userStyleRatio, profile.style_weights),
      calcCountrySimilarity(userRegionalRatio, profile.regional_weights),
      calcCountrySimilarity(userBustRatio, profile.bust_weights),
      calcCountrySimilarity(userAgeRatio, profile.age_weights),
      calcCountrySimilarity(userVibeRatio, profile.vibe_weights),
    ];
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    countryScores.push({ country: countryKey, label: profile.label, flag: profile.flag, score: avg });
  }
  countryScores.sort((a, b) => b.score - a.score);
  const topCountry = countryScores[0];

  // ==============================
  // 5. 体型傾向
  // ==============================
  const bustLabel = translateInternalTag('bust_impression', topBust);
  const buttLabel = translateInternalTag('butt_impression', topButt);
  const silhouetteLabel = translateInternalTag('body_silhouette', topSilhouette);
  const heightLabel = translateInternalTag('height_impression', topEntries({ ...(likedImages.reduce((acc, img) => {
    if (img.height_impression) acc[img.height_impression] = (acc[img.height_impression] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)) }, 1)[0] || 'average');

  const bodyOverall = [bustLabel, silhouetteLabel].filter(Boolean).join('や') || '全体のバランスを重視';

  // ==============================
  // 6. 年齢傾向
  // ==============================
  const ageDescriptions: Record<string, string> = {
    teens:    '10代後半の若々しさに惹かれる傾向があります',
    early20s: '20代前半のフレッシュな魅力を好む傾向があります',
    mid20s:   '20代中盤の落ち着きと若さのバランスを好みます',
    late20s:  '20代後半〜30代前半の大人の色気を好む傾向があります',
    thirties: '30代の成熟した知性と美しさに惹かれます',
    forties:  '40代の貫禄ある大人の魅力を好みます',
  };

  // ==============================
  // 7. メーター計算
  // ==============================
  const styleScore = (s: string) => (styleCounts[s] || 0) / totalLikes * 100;
  const vibeScore = (v: string) => (vibeCounts[v] || 0) / totalLikes * 100;
  const makeupScore = (m: string) => (makeupCounts[m] || 0) / totalLikes * 100;
  const regionalScore = (r: string) => (regionalCounts[r] || 0) / totalLikes * 100;

  const meters = {
    gyaru_level: clamp(styleScore('gyaru') * 1.5 + makeupScore('gyaru') * 1.2 + vibeScore('gyaru')),
    pure_level: clamp(vibeScore('pure') * 1.5 + styleScore('natural') + makeupScore('natural') * 0.8),
    global_level: clamp(
      regionalScore('western_style') + regionalScore('latina_style') + regionalScore('black_style') +
      regionalScore('middle_eastern_style') + styleScore('global_elegant')
    ),
    intellectual_level: clamp(styleScore('office') * 1.5 + styleScore('mature') + vibeScore('intellectual') * 1.5 + makeupScore('moderate')),
    sexy_level: clamp(styleScore('sexy') * 1.8 + vibeScore('sexy') * 1.5 + (bustCounts['very_full'] || 0) / totalLikes * 80),
    mature_level: clamp(styleScore('mature') * 1.5 + styleScore('elegant') + styleScore('office') +
      ((ageCounts['thirties'] || 0) + (ageCounts['forties'] || 0)) / totalLikes * 100),
  };

  // ==============================
  // 8. レアリティ計算
  // ==============================
  // 世間と差があるほどレア、好みが偏っているほどレア
  const rarityScore = clamp(
    uniquenessScore * 0.6 +
    (topCountry.score < 50 ? (50 - topCountry.score) : 0) * 0.4
  );

  type RarityEntry = { label: string; icon: string; description: string };
  const getRarity = (score: number): RarityEntry => {
    if (score >= 80) return { label: '超希少派', icon: 'eye', description: '上位5%以内の独自の審美眼を持つレアな好みです' };
    if (score >= 65) return { label: '希少派', icon: 'star', description: '世間とはかなり違う、個性的な好みを持っています' };
    if (score >= 50) return { label: 'やや個性派', icon: 'moon', description: '世間とは少しズレた、自分だけの感性があります' };
    if (score >= 35) return { label: 'バランス派', icon: 'sliders', description: '世間の好みと自分の好みがほどよく一致しています' };
    if (score >= 20) return { label: '大衆派', icon: 'users', description: 'みんなが好きなものを好む、共感力の高い好みです' };
    return { label: '王道派', icon: 'award', description: '世間の好みとほぼ完全に一致する、トレンドに敏感な好みです' };
  };
  const rarityEntry = getRarity(rarityScore);

  // ==============================
  // 9. フォーカスタイプ
  // ==============================
  const faceIndicators = ['清楚', '黒髪', 'ボブ', '笑顔', 'メイク', 'ショートヘア', 'ロングヘア', '目', '可愛い'];
  let faceScore = 0;
  likedImages.forEach((img) => {
    img.tags.forEach((t) => { if (faceIndicators.includes(t)) faceScore++; });
  });
  let focusType: 'face' | 'atmosphere' | 'style' | 'body' = 'atmosphere';
  if (['cool', 'mode', 'office', 'global_elegant'].includes(topStyle)) focusType = 'style';
  else if (['sexy', 'gyaru'].includes(topStyle) || ['very_full', 'full'].includes(topBust)) focusType = 'body';
  else if (faceScore > totalLikes * 1.2) focusType = 'face';

  // ==============================
  // 10. 分析テキスト生成
  // ==============================
  const regText = topRegional ? `、${translateInternalTag('regional_style', topRegional)}に惹かれる傾向` : '';
  const focusTexts = {
    face: '顔立ちや表情のニュアンスを重視するタイプ',
    style: '全体のシルエットやファッションの完成度を重視するタイプ',
    body: '体型や身体的なシルエットに惹かれやすいタイプ',
    atmosphere: '写真全体の空気感や、まとっている雰囲気を重視するタイプ',
  };
  const styleAnalysis = `あなたは「${prefEntry.label}」${regText}です。${focusTexts[focusType]}。`;
  const countryAnalysis = `あなたの好みは${topCountry.label}の感性に最も近く（一致度${topCountry.score}%）、${countryScores[1].label}（${countryScores[1].score}%）が続きます。`;
  const bodyAnalysis = `体型的には${bodyOverall}。${bustLabel ? `胸の印象は「${bustLabel}」` : ''}${buttLabel ? `、お尻は「${buttLabel}」` : ''}に惹かれやすい傾向があります。`;
  const ageAnalysis = ageDescriptions[topAge] || '';
  const rarityAnalysis = `あなたの好みは世間の中で「${rarityEntry.label}」に分類されます。${rarityEntry.description}`;

  return {
    compatibility_score: compatibilityScore,
    preference_type: prefEntry.label,
    preference_type_emoji: prefEntry.icon, // 旧互換キーにアイコンIDを格納
    mainstream_score: mainstreamScore,
    uniqueness_score: uniquenessScore,

    country_affinity: {
      top_country: topCountry.country,
      top_country_label: topCountry.label,
      top_country_flag: topCountry.flag,
      top_country_score: topCountry.score,
      rankings: countryScores,
    },

    body_preference: {
      bust_label: bustLabel,
      butt_label: buttLabel,
      height_label: heightLabel,
      silhouette_label: silhouetteLabel,
      overall: bodyOverall,
    },

    age_preference: {
      top_age: topAge,
      label: translateInternalTag('age_impression', topAge),
      description: ageDescriptions[topAge] || '',
    },

    vibe_preference: {
      top_vibe: topVibe,
      label: translateInternalTag('vibe_type', topVibe),
      score: Math.round((vibeCounts[topVibe] || 0) / totalLikes * 100),
    },

    rarity: {
      label: rarityEntry.label,
      icon: rarityEntry.icon,
      description: rarityEntry.description,
      score: rarityScore,
    },

    meters,

    summary_json: {
      top_styles: topEntries(styleCounts),
      top_regional_styles: topEntries(regionalCounts).map((r) => translateInternalTag('regional_style', r)),
      top_tags: topEntries(tagCounts, 5),
      silhouette_impression: bodyOverall,
      focus_type: focusType,
      style_analysis: styleAnalysis,
      country_analysis: countryAnalysis,
      body_analysis: bodyAnalysis,
      age_analysis: ageAnalysis,
      rarity_analysis: rarityAnalysis,
    },
  };
};
