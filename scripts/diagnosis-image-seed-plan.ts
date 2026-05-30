import type {
  AgeImpression,
  HairStyle,
  MakeupLevel,
  RegionalStyle,
  SkinTone,
  StyleGroup,
  VibeType,
} from '../src/types/image';

type Distribution<T extends string> = ReadonlyArray<{
  value: T;
  count: number;
}>;

type Background =
  | 'city_street'
  | 'cafe'
  | 'office_lounge'
  | 'gallery'
  | 'park_daylight'
  | 'bookstore'
  | 'station_concourse'
  | 'studio_soft_light'
  | 'resort_walkway'
  | 'home_interior';

export interface DiagnosisImageSeedSlot {
  id: string;
  fileName: string;
  batch: number;
  slot: number;
  style_group: Exclude<StyleGroup, 'sexy'>;
  regional_style: RegionalStyle;
  age_impression: Exclude<AgeImpression, 'teens'>;
  hair_style: HairStyle;
  skin_tone: SkinTone;
  makeup_level: MakeupLevel;
  background: Background;
  vibe_type: Exclude<VibeType, 'sexy'>;
  popularity_score: number;
  tags: string[];
  prompt: string;
  negativePrompt: string;
}

export const TOTAL_DIAGNOSIS_IMAGES = 500;
export const BATCH_COUNT = 50;
export const IMAGES_PER_BATCH = 10;

const STYLE_GROUP_DISTRIBUTION = [
  { value: 'natural', count: 36 },
  { value: 'korean', count: 36 },
  { value: 'cool', count: 36 },
  { value: 'casual', count: 36 },
  { value: 'feminine', count: 36 },
  { value: 'mature', count: 36 },
  { value: 'office', count: 36 },
  { value: 'simple', count: 36 },
  { value: 'gyaru', count: 36 },
  { value: 'cute', count: 36 },
  { value: 'sporty', count: 35 },
  { value: 'elegant', count: 35 },
  { value: 'mode', count: 35 },
  { value: 'global_elegant', count: 35 },
] as const satisfies Distribution<Exclude<StyleGroup, 'sexy'>>;

const REGIONAL_STYLE_DISTRIBUTION = [
  { value: 'japanese_style', count: 50 },
  { value: 'korean_style', count: 50 },
  { value: 'chinese_style', count: 50 },
  { value: 'western_style', count: 50 },
  { value: 'southeast_asian_style', count: 50 },
  { value: 'south_asian_style', count: 50 },
  { value: 'latina_style', count: 50 },
  { value: 'black_style', count: 50 },
  { value: 'middle_eastern_style', count: 50 },
  { value: 'global_mixed', count: 50 },
] as const satisfies Distribution<RegionalStyle>;

const AGE_IMPRESSION_DISTRIBUTION = [
  { value: 'early20s', count: 100 },
  { value: 'mid20s', count: 100 },
  { value: 'late20s', count: 100 },
  { value: 'thirties', count: 100 },
  { value: 'forties', count: 100 },
] as const satisfies Distribution<Exclude<AgeImpression, 'teens'>>;

const HAIR_STYLE_DISTRIBUTION = [
  { value: 'long_straight', count: 56 },
  { value: 'long_wave', count: 56 },
  { value: 'medium', count: 56 },
  { value: 'bob', count: 56 },
  { value: 'short', count: 56 },
  { value: 'pony', count: 55 },
  { value: 'twin', count: 55 },
  { value: 'updo', count: 55 },
  { value: 'curly', count: 55 },
] as const satisfies Distribution<HairStyle>;

const SKIN_TONE_DISTRIBUTION = [
  { value: 'fair', count: 125 },
  { value: 'medium', count: 125 },
  { value: 'tan', count: 125 },
  { value: 'dark', count: 125 },
] as const satisfies Distribution<SkinTone>;

const MAKEUP_LEVEL_DISTRIBUTION = [
  { value: 'natural', count: 125 },
  { value: 'moderate', count: 125 },
  { value: 'heavy', count: 125 },
  { value: 'gyaru', count: 125 },
] as const satisfies Distribution<MakeupLevel>;

const BACKGROUND_DISTRIBUTION = [
  { value: 'city_street', count: 50 },
  { value: 'cafe', count: 50 },
  { value: 'office_lounge', count: 50 },
  { value: 'gallery', count: 50 },
  { value: 'park_daylight', count: 50 },
  { value: 'bookstore', count: 50 },
  { value: 'station_concourse', count: 50 },
  { value: 'studio_soft_light', count: 50 },
  { value: 'resort_walkway', count: 50 },
  { value: 'home_interior', count: 50 },
] as const satisfies Distribution<Background>;

const VIBE_BY_STYLE_GROUP: Record<Exclude<StyleGroup, 'sexy'>, Exclude<VibeType, 'sexy'>> = {
  natural: 'natural',
  korean: 'elegant',
  cool: 'cool',
  casual: 'natural',
  feminine: 'pure',
  mature: 'elegant',
  office: 'intellectual',
  simple: 'natural',
  gyaru: 'gyaru',
  cute: 'cute',
  sporty: 'sporty',
  elegant: 'elegant',
  mode: 'charismatic',
  global_elegant: 'elegant',
};

const NEGATIVE_PROMPT = [
  'real person',
  'celebrity',
  'public figure',
  'lookalike',
  'child',
  'teenager',
  'school uniform',
  'swimsuit',
  'lingerie',
  'cleavage emphasis',
  'sexualized pose',
  'erotic',
  'body rating',
  'beauty score',
  'ranking text',
  'watermark',
  'logo',
  'distorted hands',
  'extra fingers',
  'heavy retouching',
].join(', ');

const expandDistribution = <T extends string>(distribution: Distribution<T>): T[] =>
  distribution.flatMap(({ value, count }) => Array.from({ length: count }, () => value));

const pickDistributed = <T extends string>(
  distribution: Distribution<T>,
  slotIndex: number,
  step: number,
  offset: number,
): T => {
  const pool = expandDistribution(distribution);
  const index = (slotIndex * step + offset) % pool.length;
  return pool[index];
};

const toBatchPart = (value: number) => value.toString().padStart(2, '0');

const buildPrompt = ({
  style_group,
  regional_style,
  age_impression,
  hair_style,
  skin_tone,
  makeup_level,
  background,
}: Pick<
  DiagnosisImageSeedSlot,
  | 'style_group'
  | 'regional_style'
  | 'age_impression'
  | 'hair_style'
  | 'skin_tone'
  | 'makeup_level'
  | 'background'
>): string =>
  [
    '1024x1024 photorealistic lifestyle portrait/card image of a fictional adult woman aged 20 or older.',
    'No real person, no celebrity resemblance, no influencer likeness.',
    `Modest contemporary outfit in a ${background} setting, ${regional_style} inspired styling, ${style_group} fashion direction.`,
    `${hair_style} hair, ${skin_tone} skin tone, ${makeup_level} makeup, ${age_impression} adult age impression, relaxed natural posture.`,
    'Editorial app card composition, clean lighting, respectful and non-sexualized, not a beauty contest, no text, no logo.',
  ].join(' ');

export const diagnosisImageSeedPlan: DiagnosisImageSeedSlot[] = Array.from(
  { length: TOTAL_DIAGNOSIS_IMAGES },
  (_, slotIndex) => {
    const batch = Math.floor(slotIndex / IMAGES_PER_BATCH) + 1;
    const slot = (slotIndex % IMAGES_PER_BATCH) + 1;
    const batchPart = toBatchPart(batch);
    const slotPart = toBatchPart(slot);
    const id = `tc_diag_b${batchPart}_s${slotPart}`;
    const style_group = pickDistributed(STYLE_GROUP_DISTRIBUTION, slotIndex, 137, 17);
    const regional_style = pickDistributed(REGIONAL_STYLE_DISTRIBUTION, slotIndex, 149, 23);
    const age_impression = pickDistributed(AGE_IMPRESSION_DISTRIBUTION, slotIndex, 151, 31);
    const hair_style = pickDistributed(HAIR_STYLE_DISTRIBUTION, slotIndex, 157, 43);
    const skin_tone = pickDistributed(SKIN_TONE_DISTRIBUTION, slotIndex, 163, 59);
    const makeup_level = pickDistributed(MAKEUP_LEVEL_DISTRIBUTION, slotIndex, 167, 71);
    const background = pickDistributed(BACKGROUND_DISTRIBUTION, slotIndex, 171, 89);
    const vibe_type = VIBE_BY_STYLE_GROUP[style_group];

    return {
      id,
      fileName: `diagnosis/b${batchPart}/${id}.webp`,
      batch,
      slot,
      style_group,
      regional_style,
      age_impression,
      hair_style,
      skin_tone,
      makeup_level,
      background,
      vibe_type,
      popularity_score: 50,
      tags: [style_group, regional_style, age_impression, hair_style, skin_tone, background],
      prompt: buildPrompt({
        style_group,
        regional_style,
        age_impression,
        hair_style,
        skin_tone,
        makeup_level,
        background,
      }),
      negativePrompt: NEGATIVE_PROMPT,
    };
  },
);

export const diagnosisImageBatchPlan = Array.from({ length: BATCH_COUNT }, (_, batchIndex) => {
  const batch = batchIndex + 1;
  const start = batchIndex * IMAGES_PER_BATCH + 1;
  const end = start + IMAGES_PER_BATCH - 1;

  return {
    batch,
    id: `b${toBatchPart(batch)}`,
    size: IMAGES_PER_BATCH,
    assetIndexStart: start,
    assetIndexEnd: end,
    directory: `diagnosis/b${toBatchPart(batch)}`,
  };
});

export const diagnosisImageGenerationRules = {
  dimensions: '1024x1024',
  outputFormat: 'webp',
  subject: 'fictional adult women only',
  resemblancePolicy:
    'no real people, celebrity, influencer, public figure, or lookalike resemblance',
  clothingPolicy: 'modest contemporary clothing only',
  sexualizationPolicy: 'no sexualized pose, body emphasis, lingerie, swimsuit, or erotic framing',
  excludedMetadataValues: {
    style_group: ['sexy'],
    age_impression: ['teens'],
    vibe_type: ['sexy'],
  },
  negativePrompt: NEGATIVE_PROMPT,
} as const;
