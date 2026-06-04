import * as fs from 'fs';
import * as path from 'path';
import { diagnosisImageSeedPlan } from './diagnosis-image-seed-plan';

const STYLE_MAP: Record<string, string> = {
  natural: 'ナチュラル',
  korean: '韓国風',
  cool: 'クール',
  casual: 'カジュアル',
  feminine: 'フェミニン',
  mature: '大人っぽさ',
  office: 'オフィス',
  simple: 'シンプル',
  gyaru: 'ギャル',
  cute: 'キュート',
  sporty: 'スポーティ',
  elegant: 'エレガント',
  mode: 'モード',
  global_elegant: 'グローバル',
};

const REGIONAL_MAP: Record<string, string> = {
  japanese_style: '日本風',
  korean_style: '韓国風',
  chinese_style: '中国風',
  western_style: '欧米風',
  southeast_asian_style: '東南アジア風',
  south_asian_style: '南アジア風',
  latina_style: 'ラテン風',
  black_style: 'アフリカ風',
  middle_eastern_style: '中東風',
  global_mixed: 'グローバル',
};

const AGE_MAP: Record<string, string> = {
  early20s: '20代前半',
  mid20s: '20代半ば',
  late20s: '20代後半',
  thirties: '30代',
  forties: '40代',
};

const HAIR_MAP: Record<string, string> = {
  long_straight: 'ストレートヘア',
  long_wave: 'ウェーブヘア',
  medium: 'ミディアムヘア',
  bob: 'ボブ',
  short: 'ショートヘア',
  pony: 'ポニーテール',
  twin: 'ツインテール',
  updo: 'アップスタイル',
  curly: 'カーリーヘア',
};

const BACKGROUND_MAP: Record<string, string> = {
  city_street: 'ストリート',
  cafe: 'カフェ',
  office_lounge: 'オフィス',
  gallery: 'ギャラリー',
  park_daylight: '公園',
  bookstore: '書店',
  station_concourse: '駅',
  studio_soft_light: 'スタジオ',
  resort_walkway: 'リゾート',
  home_interior: '部屋',
};

// 追加対象のID
const targetIds = [
  'tc_diag_b15_s01',
  'tc_diag_b15_s02',
  'tc_diag_b15_s03',
  'tc_diag_b29_s01',
  'tc_diag_b29_s02',
  'tc_diag_b29_s03',
];

const main = () => {
  const metadataPath = path.join(__dirname, '../src/data/imageMetadata.ts');
  let content = fs.readFileSync(metadataPath, 'utf8');

  // 既に登録されているか確認
  const alreadyRegistered = targetIds.filter((id) => content.includes(`id: '${id}'`));
  if (alreadyRegistered.length > 0) {
    console.log(`⚠️ 以下のIDは既に登録されています: ${alreadyRegistered.join(', ')}`);
    return;
  }

  // ターゲットのプランデータを抽出
  const targets = diagnosisImageSeedPlan.filter((img) => targetIds.includes(img.id));

  // 追加用テキストの構築
  let addString = '';
  targets.forEach((img) => {
    const tags = [
      STYLE_MAP[img.style_group] || img.style_group,
      BACKGROUND_MAP[img.background] || img.background,
      HAIR_MAP[img.hair_style] || img.hair_style,
      REGIONAL_MAP[img.regional_style] || img.regional_style,
      AGE_MAP[img.age_impression] || img.age_impression,
    ];

    addString += `  {\n`;
    addString += `    id: '${img.id}',\n`;
    addString += `    image_url: '${img.image_url}',\n`;
    addString += `    style_group: '${img.style_group}',\n`;
    addString += `    regional_style: '${img.regional_style}',\n`;
    addString += `    body_silhouette: '${img.body_silhouette || 'balanced'}',\n`;
    addString += `    bust_impression: '${img.bust_impression || 'average'}',\n`;
    addString += `    butt_impression: '${img.butt_impression || 'average'}',\n`;
    addString += `    height_impression: '${img.height_impression || 'average'}',\n`;
    addString += `    age_impression: '${img.age_impression}',\n`;
    addString += `    vibe_type: '${img.vibe_type}',\n`;
    addString += `    hair_style: '${img.hair_style}',\n`;
    addString += `    skin_tone: '${img.skin_tone}',\n`;
    addString += `    makeup_level: '${img.makeup_level}',\n`;
    addString += `    tags: [${tags.map((t) => `'${t}'`).join(', ')}],\n`;
    addString += `    popularity_score: ${img.popularity_score || 50},\n`;
    addString += `  },\n`;
  });

  // LOCAL_IMAGES 配列の末尾に挿入する
  // ファイル末尾の `];` を見つけて、その直前に挿入する
  const lastIndex = content.lastIndexOf('];');
  if (lastIndex === -1) {
    console.error('❌ LOCAL_IMAGES配列の末尾 (];) が見つかりませんでした。');
    return;
  }

  const updatedContent = content.substring(0, lastIndex) + addString + content.substring(lastIndex);
  fs.writeFileSync(metadataPath, updatedContent, 'utf8');

  console.log(`✅ ${targets.length} 件のメタデータを imageMetadata.ts に追記しました。`);
};

main();
