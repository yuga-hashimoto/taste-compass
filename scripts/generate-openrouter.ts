import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.OPENROUTER_API_KEY || '';

// 引数のパース
const args: Record<string, string> = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i].replace(/^--/, '');
  const val = process.argv[i + 1];
  args[key] = val;
}

const id = args.id;
const prompt = args.prompt;
const styleGroup = args.style || 'natural';
const regionalStyle = args.region || 'japanese_style';
const ageImpression = args.age || 'early20s';
const vibeType = args.vibe || 'natural';
const hairStyle = args.hair || 'long_straight';
const skinTone = args.skin || 'fair';
const makeupLevel = args.makeup || 'natural';
const tagsStr = args.tags || '';

if (!id || !prompt) {
  console.error('Usage: npx ts-node scripts/generate-openrouter.ts --id <id> --prompt "<prompt>" [options]');
  process.exit(1);
}

// 保存先ディレクトリの判定 (例: tc_diag_b24_s01 -> b24)
const batchMatch = id.match(/tc_diag_b(\d+)_s(\d+)/);
if (!batchMatch) {
  console.error('Invalid ID format. Must be like tc_diag_b24_s01');
  process.exit(1);
}
const batchNum = batchMatch[1];
const serialNum = batchMatch[2];

const destDir = path.join(__dirname, '..', 'public', 'images', 'diagnosis', `b${batchNum}`);
fs.mkdirSync(destDir, { recursive: true });

const destWebpPath = path.join(destDir, `${id}.webp`);

async function generate() {
  try {
    console.log(`Generating image for ID: ${id}...`);
    console.log(`Prompt: "${prompt}"`);

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'black-forest-labs/flux.2-klein-4b',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image']
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        timeout: 90000 // 90秒
      }
    );

    const choice = response.data?.choices?.[0];
    if (!choice || !choice.message || !choice.message.images || choice.message.images.length === 0) {
      console.error('Failed to generate image. No image data in response.');
      console.error('Response:', JSON.stringify(response.data, null, 2));
      process.exit(1);
    }

    const imgObj = choice.message.images[0];
    const dataUrl = imgObj.image_url?.url;

    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      console.error('Invalid image data URL format in response.');
      process.exit(1);
    }

    // base64のデコード
    const commaIdx = dataUrl.indexOf(',');
    const base64Data = dataUrl.substring(commaIdx + 1);
    const buffer = Buffer.from(base64Data, 'base64');

    // sharpでWebPにリサイズして変換保存
    console.log('Converting and resizing to WebP...');
    await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside' })
      .webp({ quality: 80 })
      .toFile(destWebpPath);

    console.log(`\n🎉 OK: Image saved to ${destWebpPath}`);

    // メタデータコードの生成
    const tags = tagsStr ? tagsStr.split(',').map(t => `'${t.trim()}'`) : [];
    const metaCode = `  {
    id: '${id}',
    image_url: '/images/diagnosis/b${batchNum}/${id}.webp',
    style_group: '${styleGroup}',
    regional_style: '${regionalStyle}',
    body_silhouette: 'balanced',
    bust_impression: 'average',
    butt_impression: 'average',
    height_impression: 'average',
    age_impression: '${ageImpression}',
    vibe_type: '${vibeType}',
    hair_style: '${hairStyle}',
    skin_tone: '${skinTone}',
    makeup_level: '${makeupLevel}',
    tags: [${tags.join(', ')}],
    popularity_score: 55,
  },`;

    console.log('\n--- Metadata Code to insert: ---');
    console.log(metaCode);
    console.log('--------------------------------\n');

  } catch (error: any) {
    console.error('Error during generation:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

generate();
