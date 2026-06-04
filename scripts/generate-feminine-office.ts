import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '../public/images/tmp_craiyon');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ユーザーが指定した5つのテーマのプロンプト
const PROMPTS = [
  'A beautiful and cute Japanese woman, mid-20s, intelligent expression, wearing white blouse and jacket, half-up hairstyle, in a cozy office lounge, realistic photo, masterpiece, 8k resolution, highly detailed skin texture, natural lighting',
  'A beautiful and cute Japanese woman, mid-20s, elegant smile, wearing knit dress, wavy long hair, inside an art museum gallery, realistic photo, masterpiece, 8k resolution, highly detailed skin texture, natural lighting',
  'A beautiful and cute Japanese woman, late 20s, elegant expression, wearing chic dress, updo hairstyle, in a luxury hotel lobby, realistic photo, masterpiece, 8k resolution, highly detailed skin texture, natural lighting',
  'A beautiful and cute Japanese woman, mid-20s, cool and pensive expression, wearing trench coat, medium bob cut hair, on a night street with neon lights, realistic photo, masterpiece, 8k resolution, highly detailed skin texture, natural lighting',
  'A beautiful and cute Japanese woman, mid-20s, happy smiling, wearing feminine top, long straight hair, inside a cozy elegant restaurant, realistic photo, masterpiece, 8k resolution, highly detailed skin texture, natural lighting',
];

const getTimestamp = () => {
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${YYYY}${MM}${DD}_${HH}${mm}${ss}`;
};

const downloadImage = async (prompt: string, index: number): Promise<string> => {
  console.log(`[${index + 1}/5] 画像生成中...`);
  console.log(`📝 Prompt: "${prompt}"`);

  // seedをランダムにして別画像を生成
  const seed = Math.floor(100000 + Math.random() * 900000);
  const url = `https://image.pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 60000, // 60秒タイムアウト
  });

  const timestamp = getTimestamp();
  const rand = Math.floor(100 + Math.random() * 900);
  const filename = `gemini_${timestamp}_${rand}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filepath, Buffer.from(response.data));
  console.log(`✅ 保存完了: ${filename}`);
  return filename;
};

const main = async () => {
  console.log('====================================');
  console.log('🚀 フェミニン・オフィス・エレガント画像生成開始');
  console.log(`出力先: ${OUTPUT_DIR}`);
  console.log('====================================');

  const generatedFiles: string[] = [];

  for (let i = 0; i < PROMPTS.length; i++) {
    try {
      const filename = await downloadImage(PROMPTS[i], i);
      generatedFiles.push(filename);
      // API負荷軽減のために3秒スリープ
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (err: any) {
      console.error(`❌ ${i + 1}枚目の生成に失敗しました:`, err.message || err);
    }
  }

  console.log('\n====================================');
  console.log('🎉 生成結果一覧:');
  generatedFiles.forEach((file) => console.log(`- ${file}`));
  console.log('====================================');
};

main();
