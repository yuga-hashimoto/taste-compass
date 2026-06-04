import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
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

// 使用法: npx tsx scripts/process-generated.ts <batchNum> <sourceDir>
const batchNumStr = process.argv[2];
const srcDir = process.argv[3];

if (!batchNumStr || !srcDir) {
  console.error('❌ 使用法: npx tsx scripts/process-generated.ts <batchNum> <sourceDir>');
  process.exit(1);
}

const batchNum = parseInt(batchNumStr, 10);
const destDir = path.join(
  __dirname,
  '..',
  'public',
  'images',
  'diagnosis',
  `b${batchNumStr.padStart(2, '0')}`,
);

fs.mkdirSync(destDir, { recursive: true });

async function main() {
  const metadataPath = path.join(__dirname, '../src/data/imageMetadata.ts');
  let metadataContent = fs.readFileSync(metadataPath, 'utf8');

  // ソースディレクトリ内のファイル一覧を取得
  const files = fs.readdirSync(srcDir);
  const prefix = `tc_diag_b${batchNumStr.padStart(2, '0')}_s`;

  console.log(`Processing batch ${batchNum} from ${srcDir}...`);

  let addedCount = 0;
  let addString = '';

  for (let slot = 1; slot <= 10; slot++) {
    const slotStr = String(slot).padStart(2, '0');
    const slotId = `tc_diag_b${batchNumStr.padStart(2, '0')}_s${slotStr}`;

    // 既に metadata に登録されている場合は変換のみ (またはスキップ)
    const isRegistered = metadataContent.includes(`id: '${slotId}'`);

    // このスロットに対応するPNGファイルを探す
    const targetPrefix = `${prefix}${slotStr}_`;
    const targetPngs = files.filter((f) => f.startsWith(targetPrefix) && f.endsWith('.png'));

    if (targetPngs.length === 0) {
      console.log(`SKIP: ${slotId} のPNGが見つかりません。`);
      continue;
    }

    const srcFile = path.join(srcDir, targetPngs[0]);
    const destFile = path.join(destDir, `${slotId}.webp`);

    // 1. SharpによるWebP変換
    try {
      await sharp(srcFile)
        .resize(1024, 1024, { fit: 'inside' })
        .webp({ quality: 80 })
        .toFile(destFile);
      console.log(`✅ WebP変換成功: ${slotId}.webp`);
    } catch (e: any) {
      console.error(`❌ WebP変換失敗 (${slotId}): ${e.message}`);
      continue;
    }

    // 2. メタデータ登録用の文字列構築 (未登録の場合のみ)
    if (!isRegistered) {
      const planData = diagnosisImageSeedPlan.find((img) => img.id === slotId);
      if (!planData) {
        console.error(`❌ プランデータが見つかりません: ${slotId}`);
        continue;
      }

      const tags = [
        STYLE_MAP[planData.style_group] || planData.style_group,
        BACKGROUND_MAP[planData.background] || planData.background,
        HAIR_MAP[planData.hair_style] || planData.hair_style,
        REGIONAL_MAP[planData.regional_style] || planData.regional_style,
        AGE_MAP[planData.age_impression] || planData.age_impression,
      ];

      addString += `  {\n`;
      addString += `    id: '${planData.id}',\n`;
      addString += `    image_url: '${planData.image_url}',\n`;
      addString += `    style_group: '${planData.style_group}',\n`;
      addString += `    regional_style: '${planData.regional_style}',\n`;
      addString += `    body_silhouette: '${planData.body_silhouette || 'balanced'}',\n`;
      addString += `    bust_impression: '${planData.bust_impression || 'average'}',\n`;
      addString += `    butt_impression: '${planData.butt_impression || 'average'}',\n`;
      addString += `    height_impression: '${planData.height_impression || 'average'}',\n`;
      addString += `    age_impression: '${planData.age_impression}',\n`;
      addString += `    vibe_type: '${planData.vibe_type}',\n`;
      addString += `    hair_style: '${planData.hair_style}',\n`;
      addString += `    skin_tone: '${planData.skin_tone}',\n`;
      addString += `    makeup_level: '${planData.makeup_level}',\n`;
      addString += `    tags: [${tags.map((t) => `'${t}'`).join(', ')}],\n`;
      addString += `    popularity_score: ${planData.popularity_score || 50},\n`;
      addString += `  },\n`;

      addedCount++;
    } else {
      console.log(`ℹ️ ${slotId} は既に imageMetadata.ts に登録されています。`);
    }
  }

  // メタデータへの追記
  if (addedCount > 0) {
    const lastIndex = metadataContent.lastIndexOf('];');
    if (lastIndex === -1) {
      console.error('❌ LOCAL_IMAGES配列の末尾 (];) が見つかりませんでした。');
      return;
    }

    const updatedContent =
      metadataContent.substring(0, lastIndex) + addString + metadataContent.substring(lastIndex);
    fs.writeFileSync(metadataPath, updatedContent, 'utf8');
    console.log(`✅ ${addedCount} 件のメタデータを imageMetadata.ts に追記しました。`);
  }
}

main().catch((err) => {
  console.error('❌ エラーが発生しました:', err);
});
