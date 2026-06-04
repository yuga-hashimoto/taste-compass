import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.OPENROUTER_API_KEY || '';

// 属性の候補値定義
const STYLES = ['gyaru', 'cute', 'korean', 'global_elegant', 'mode', 'natural', 'casual', 'office', 'sporty', 'elegant'];
const REGIONS = ['middle_eastern_style', 'south_asian_style', 'southeast_asian_style', 'latina_style', 'black_style', 'japanese_style', 'korean_style', 'western_style', 'chinese_style', 'global_mixed'];
const AGES = ['teens', 'forties', 'early20s', 'mid20s', 'late20s', 'thirties'];
const VIBES = ['gyaru', 'cute', 'charismatic', 'sporty', 'intellectual', 'pure', 'cool', 'natural', 'elegant'];
const SILHOUETTES = ['curvy', 'petite', 'slim', 'healthy', 'balanced'];
const HAIRS = ['curly', 'pony', 'bob', 'long_straight', 'long_wave', 'medium', 'short', 'updo'];
const SKINS = ['tan', 'dark', 'fair', 'medium'];
const MAKEUPS = ['gyaru', 'heavy', 'natural', 'moderate'];

// 定義済みの日本語タグ
const STYLE_TAGS: Record<string, string> = { gyaru: 'ギャル', cute: '可愛い', korean: '韓国風', global_elegant: 'グローバル', mode: 'モード', natural: 'ナチュラル', casual: 'カジュアル', office: 'オフィス', sporty: 'スポーティ', elegant: 'エレガント' };
const REGION_TAGS: Record<string, string> = { middle_eastern_style: '中東系', south_asian_style: '南アジア系', southeast_asian_style: '東南アジア系', latina_style: 'ラテン系', black_style: 'ブラック系', japanese_style: '日本風', korean_style: '韓国風', western_style: '洋風', chinese_style: '中国風', global_mixed: 'ハーフ' };
const AGE_TAGS: Record<string, string> = { teens: '10代', forties: '40代', early20s: '20代前半', mid20s: '20代半ば', late20s: '20代後半', thirties: '30代' };

// プロンプト生成
function generatePrompt(style: string, region: string, age: string, hair: string): string {
  let subject = `A portrait of a `;
  if (age === 'teens') subject += 'teenage girl (18 years old)';
  else if (age === 'forties') subject += 'mature woman in her 40s';
  else if (age === 'thirties') subject += 'woman in her 30s';
  else subject += 'young woman';

  let regionalDesc = '';
  if (region === 'japanese_style') regionalDesc = 'Japanese';
  else if (region === 'korean_style') regionalDesc = 'Korean';
  else if (region === 'chinese_style') regionalDesc = 'Chinese';
  else if (region === 'western_style') regionalDesc = 'Caucasian';
  else if (region === 'black_style') regionalDesc = 'Black';
  else if (region === 'latina_style') regionalDesc = 'Latina';
  else if (region === 'middle_eastern_style') regionalDesc = 'Middle Eastern';
  else if (region === 'south_asian_style') regionalDesc = 'South Asian';
  else if (region === 'southeast_asian_style') regionalDesc = 'Southeast Asian';
  else regionalDesc = 'East Asian';

  subject = `A portrait of a ${regionalDesc} ${subject.replace('A portrait of a ', '')}`;

  let hairDesc = '';
  if (hair === 'long_straight') hairDesc = 'long straight hair';
  else if (hair === 'long_wave') hairDesc = 'long wavy hair';
  else if (hair === 'bob') hairDesc = 'bob haircut';
  else if (hair === 'short') hairDesc = 'short haircut';
  else if (hair === 'pony') hairDesc = 'ponytail';
  else if (hair === 'curly') hairDesc = 'curly hair';
  else if (hair === 'updo') hairDesc = 'updo hair';
  else hairDesc = 'medium-length hair';

  let styleDesc = '';
  if (style === 'gyaru') styleDesc = 'wearing trendy colorful street fashion, with stylish makeup, looking confident';
  else if (style === 'cute') styleDesc = 'wearing a cute pastel outfit, smiling brightly, idol-like style';
  else if (style === 'korean') styleDesc = 'wearing trendy modern Korean casual clothing, chic and aesthetic';
  else if (style === 'elegant') styleDesc = 'wearing a sophisticated elegant dress, graceful posture';
  else if (style === 'office') styleDesc = 'wearing stylish office casual suit, intellectual look';
  else if (style === 'sporty') styleDesc = 'wearing athletic sportswear, energetic and healthy look';
  else if (style === 'mode') styleDesc = 'wearing avant-garde high-fashion clothing, artistic modeling';
  else if (style === 'casual') styleDesc = 'wearing casual denim jacket and t-shirt, relaxed look';
  else styleDesc = 'wearing simple clean minimalist clothing';

  let bg = 'in a stylish setting';
  if (style === 'office') bg = 'in a modern office hallway';
  else if (style === 'gyaru') bg = 'in a neon-lit Shibuya street at dusk';
  else if (style === 'sporty') bg = 'on an outdoor running track during morning sun';
  else if (style === 'elegant') bg = 'in a luxury hotel lobby or ballroom';
  else if (style === 'natural') bg = 'in a light-filled greenhouse garden';
  else if (style === 'cute') bg = 'in a colorful cafe or dessert shop';
  else bg = 'with soft natural background';

  return `Close-up ${subject}, ${hairDesc}, ${styleDesc}, ${bg}, soft cinematic lighting, highly detailed, realistic skin texture, photorealistic, 8k`;
}

// リトライ付きAPI呼び出し
async function callOpenRouterWithRetry(prompt: string, retries = 3, delay = 5000): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'black-forest-labs/flux.2-klein-4b',
          messages: [{ role: 'user', content: prompt }],
          modalities: ['image']
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          timeout: 90000
        }
      );
      const dataUrl = response.data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (dataUrl) return dataUrl;
      throw new Error('No image URL in response');
    } catch (e: any) {
      console.warn(`Attempt ${attempt} failed: ${e.response ? JSON.stringify(e.response.data) : e.message}`);
      if (attempt === retries) throw e;
      await new Promise(r => setTimeout(r, delay * attempt));
    }
  }
  throw new Error('Retries exhausted');
}

// スリープ
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('Bulk generation started...');
  
  // 生成するIDの配列構築 (合計236枚)
  // 欠番埋め: b24_s02〜b24_s10 (9枚), b25〜b28 (各10枚, 40枚)
  // 新規バッチ: b31〜b48 (各10枚, 180枚), b49_s01〜b49_s07 (7枚)
  const targets: { id: string; batch: string; serial: string }[] = [];
  
  // b24 s02-s10
  for (let s = 2; s <= 10; s++) {
    targets.push({ id: `tc_diag_b24_s${String(s).padStart(2, '0')}`, batch: '24', serial: String(s).padStart(2, '0') });
  }
  // b25-b28
  for (let b = 25; b <= 28; b++) {
    for (let s = 1; s <= 10; s++) {
      targets.push({ id: `tc_diag_b${b}_s${String(s).padStart(2, '0')}`, batch: String(b), serial: String(s).padStart(2, '0') });
    }
  }
  // b31-b48
  for (let b = 31; b <= 48; b++) {
    for (let s = 1; s <= 10; s++) {
      targets.push({ id: `tc_diag_b${b}_s${String(s).padStart(2, '0')}`, batch: String(b), serial: String(s).padStart(2, '0') });
    }
  }
  // b49 s01-s07
  for (let s = 1; s <= 7; s++) {
    targets.push({ id: `tc_diag_b49_s${String(s).padStart(2, '0')}`, batch: '49', serial: String(s).padStart(2, '0') });
  }

  console.log(`Planned targets: ${targets.length} images`);

  const generatedMetadata: string[] = [];

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const destDir = path.join(__dirname, '..', 'public', 'images', 'diagnosis', `b${t.batch}`);
    fs.mkdirSync(destDir, { recursive: true });
    const destWebpPath = path.join(destDir, `${t.id}.webp`);

    // 冪等性チェック
    if (fs.existsSync(destWebpPath)) {
      console.log(`[${i+1}/${targets.length}] SKIP: ${t.id} already exists`);
      continue;
    }

    // 属性の決定 (偏りがないようにインデックスでサイクル)
    // teens を約30% (70枚)、forties を約13% (30枚) 優先配分
    let age = AGES[i % AGES.length];
    if (i % 3 === 0) age = 'teens';
    else if (i % 8 === 0) age = 'forties';

    // gyaru, cute, korean, global_elegant, mode を優先
    let style = STYLES[i % STYLES.length];
    if (i % 5 === 0) style = 'gyaru';
    else if (i % 5 === 1) style = 'cute';
    else if (i % 5 === 2) style = 'korean';

    let region = REGIONS[i % REGIONS.length];
    if (i % 3 === 0) region = REGIONS[i % 5]; // middle_eastern, south_asian, southeast_asian, latina, black を増やす

    const vibe = VIBES[i % VIBES.length];
    const silhouette = SILHOUETTES[i % SILHOUETTES.length];
    const hair = HAIRS[i % HAIRS.length];
    const skin = SKINS[i % SKINS.length];
    const makeup = MAKEUPS[i % MAKEUPS.length];

    const promptText = generatePrompt(style, region, age, hair);

    // 日本語タグの構築
    const tags = ['診断用'];
    if (STYLE_TAGS[style]) tags.push(STYLE_TAGS[style]);
    if (REGION_TAGS[region]) tags.push(REGION_TAGS[region]);
    if (AGE_TAGS[age]) tags.push(AGE_TAGS[age]);
    if (style === 'gyaru') tags.push('ギャルメイク');
    if (hair === 'pony') tags.push('ポニーテール');
    if (hair === 'bob') tags.push('ボブ');
    if (hair === 'curly') tags.push('カーリーヘア');

    try {
      console.log(`[${i+1}/${targets.length}] Generating ${t.id}...`);
      const dataUrl = await callOpenRouterWithRetry(promptText);
      const commaIdx = dataUrl.indexOf(',');
      const base64Data = dataUrl.substring(commaIdx + 1);
      const buffer = Buffer.from(base64Data, 'base64');

      await sharp(buffer)
        .resize(1024, 1024, { fit: 'inside' })
        .webp({ quality: 80 })
        .toFile(destWebpPath);

      console.log(`  Saved to ${destWebpPath}`);

      const metaCode = `  {
    id: '${t.id}',
    image_url: '/images/diagnosis/b${t.batch}/${t.id}.webp',
    style_group: '${style}',
    regional_style: '${region}',
    body_silhouette: '${silhouette}',
    bust_impression: 'average',
    butt_impression: 'average',
    height_impression: 'average',
    age_impression: '${age}',
    vibe_type: '${vibe}',
    hair_style: '${hair}',
    skin_tone: '${skin}',
    makeup_level: '${makeup}',
    tags: [${tags.map(x=>`'${x}'`).join(', ')}],
    popularity_score: 55,
  },`;

      generatedMetadata.push(metaCode);
      
      // 定期的にメタデータを一時保存（進捗保存）
      fs.writeFileSync(
        path.join(__dirname, 'temp-metadata-progress.json'),
        JSON.stringify(generatedMetadata, null, 2),
        'utf8'
      );

      // OpenRouterへの負荷とRate Limit回避のためのウェイト (5秒)
      await sleep(5000);

    } catch (e: any) {
      console.error(`❌ FAILED on ${t.id}:`, e.message);
      // エラーが頻発した場合は一時中断
      console.log('Stopping execution due to error.');
      process.exit(1);
    }
  }

  // 最後にメタデータファイルを一括更新する
  if (generatedMetadata.length > 0) {
    console.log('Writing metadata to src/data/imageMetadata.ts...');
    const metaFilePath = path.join(__dirname, '..', 'src', 'data', 'imageMetadata.ts');
    let content = fs.readFileSync(metaFilePath, 'utf8');

    // 配列の最後 `];` の直前に一括挿入
    const insertIdx = content.lastIndexOf('];');
    if (insertIdx !== -1) {
      const insertion = '\n' + generatedMetadata.join('\n') + '\n';
      content = content.slice(0, insertIdx) + insertion + content.slice(insertIdx);
      fs.writeFileSync(metaFilePath, content, 'utf8');
      console.log('🎉 Metadata updated successfully!');
      
      // 一時ファイルの削除
      try {
        fs.unlinkSync(path.join(__dirname, 'temp-metadata-progress.json'));
      } catch {}
    } else {
      console.error('Could not find inserting position in imageMetadata.ts');
    }
  }

  console.log('All bulk generation processes finished.');
}

main();
