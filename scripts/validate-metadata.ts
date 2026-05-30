import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 許容される内部タグの定義値
const ALLOWED_STYLE_GROUPS = [
  'natural',
  'clean',
  'cool',
  'mode',
  'casual',
  'feminine',
  'korean',
  'office',
  'mature',
  'intellectual',
  'urban',
  'soft',
  'simple',
  'travel',
  'cafe',
  'light_gal',
  'global_elegant',
];

const ALLOWED_REGIONAL_STYLES = [
  'japanese_style',
  'korean_style',
  'chinese_style',
  'southeast_asian_style',
  'south_asian_style',
  'western_style',
  'latina_style',
  'middle_eastern_style',
  'global_mixed',
];

const ALLOWED_SKIN_TONES = ['fair', 'light', 'medium', 'tan', 'deep'];
const ALLOWED_HAIR_TEXTURES = ['straight', 'soft_wave', 'wavy', 'curly', 'coily'];
const ALLOWED_FASHION_CULTURES = [
  'minimal',
  'office_casual',
  'street',
  'feminine',
  'elegant',
  'trendy',
  'relaxed',
  'urban',
];
const ALLOWED_BODY_SILHOUETTES = ['slim', 'balanced', 'healthy', 'curvy', 'soft'];
const ALLOWED_BUST_IMPRESSIONS = ['subtle', 'average', 'full'];
const ALLOWED_HEIGHT_IMPRESSIONS = ['petite', 'average', 'tall'];
const ALLOWED_OVERALL_STYLES = [
  'clean',
  'casual',
  'feminine',
  'mature',
  'cool',
  'soft',
  'elegant',
  'natural',
];

// 不適切なNGワードリスト (身体的性的評価や優劣表現の禁止)
const NG_WORDS = [
  '美人',
  'ブス',
  '顔面偏差値',
  '偏差値',
  '女を採点',
  '採点',
  'モテる',
  'ランク',
  '評価',
  '巨乳',
  '貧乳',
  '爆乳',
  '美乳',
  '爆尻',
  '美尻',
  'sexy',
  'hot',
  'おっぱい',
  'モテ顔',
  'エロい',
  '抱きたい',
  'モテる顔ランキング',
  '顔の点数',
  '外見ランク',
  '外国人好き',
];

interface MetadataItem {
  file_name: string;
  style_group: string;
  regional_style?: string;
  skin_tone?: string;
  hair_texture?: string;
  fashion_culture?: string;
  body_silhouette?: string;
  bust_impression?: string;
  height_impression?: string;
  overall_style?: string;
  tags: string[];
  short_description?: string;
}

const validateMetadata = () => {
  const filePath = path.join(__dirname, 'metadata.json');
  console.log(`🔍 メタデータを検証中: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error('❌ Error: metadata.json が見つかりません。');
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const items: MetadataItem[] = JSON.parse(rawData);

    if (!Array.isArray(items)) {
      console.error('❌ Error: metadata.json はオブジェクト配列である必要があります。');
      process.exit(1);
    }

    let errorsCount = 0;

    items.forEach((item, index) => {
      const prefix = `[Index ${index} - ${item.file_name || 'No Name'}]`;

      // 1. 必須プロパティの存在確認
      if (!item.file_name) {
        console.error(`${prefix} file_name は必須です。`);
        errorsCount++;
      }
      if (!item.style_group) {
        console.error(`${prefix} style_group は必須です。`);
        errorsCount++;
      }
      if (!item.tags || !Array.isArray(item.tags) || item.tags.length === 0) {
        console.error(`${prefix} tags 配列は必須で、1つ以上の要素を含める必要があります。`);
        errorsCount++;
      }

      // 2. 許容値の範囲チェック
      if (item.style_group && !ALLOWED_STYLE_GROUPS.includes(item.style_group)) {
        console.error(`${prefix} 不適切な style_group: "${item.style_group}"`);
        errorsCount++;
      }

      if (item.regional_style && !ALLOWED_REGIONAL_STYLES.includes(item.regional_style)) {
        console.error(`${prefix} 不適切な regional_style: "${item.regional_style}"`);
        errorsCount++;
      }

      if (item.skin_tone && !ALLOWED_SKIN_TONES.includes(item.skin_tone)) {
        console.error(`${prefix} 不適切な skin_tone: "${item.skin_tone}"`);
        errorsCount++;
      }

      if (item.hair_texture && !ALLOWED_HAIR_TEXTURES.includes(item.hair_texture)) {
        console.error(`${prefix} 不適切な hair_texture: "${item.hair_texture}"`);
        errorsCount++;
      }

      if (item.fashion_culture && !ALLOWED_FASHION_CULTURES.includes(item.fashion_culture)) {
        console.error(`${prefix} 不適切な fashion_culture: "${item.fashion_culture}"`);
        errorsCount++;
      }

      if (item.body_silhouette && !ALLOWED_BODY_SILHOUETTES.includes(item.body_silhouette)) {
        console.error(`${prefix} 不適切な body_silhouette: "${item.body_silhouette}"`);
        errorsCount++;
      }

      if (item.bust_impression && !ALLOWED_BUST_IMPRESSIONS.includes(item.bust_impression)) {
        console.error(`${prefix} 不適切な bust_impression: "${item.bust_impression}"`);
        errorsCount++;
      }

      if (item.height_impression && !ALLOWED_HEIGHT_IMPRESSIONS.includes(item.height_impression)) {
        console.error(`${prefix} 不適切な height_impression: "${item.height_impression}"`);
        errorsCount++;
      }

      if (item.overall_style && !ALLOWED_OVERALL_STYLES.includes(item.overall_style)) {
        console.error(`${prefix} 不適切な overall_style: "${item.overall_style}"`);
        errorsCount++;
      }

      // 3. NGワード検出
      const textToScan = [item.file_name || '', item.short_description || '', ...(item.tags || [])]
        .join(' ')
        .toLowerCase();

      NG_WORDS.forEach((ngWord) => {
        if (textToScan.includes(ngWord.toLowerCase())) {
          console.error(`${prefix} 禁止ワードを検知しました: "${ngWord}"`);
          errorsCount++;
        }
      });
    });

    if (errorsCount > 0) {
      console.error(`\n❌ 検証失敗: ${errorsCount} 個のエラーが検出されました。`);
      process.exit(1);
    } else {
      console.log('\n✅ メタデータ検証成功: すべてのルールを満たしています。');
      process.exit(0);
    }
  } catch (error: any) {
    console.error(
      '❌ Error: ファイル読み込みまたはJSONパース中に例外が発生しました:',
      error.message,
    );
    process.exit(1);
  }
};

validateMetadata();
