import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '../public/images/tmp_craiyon');
const STATUS_FILE = path.resolve(__dirname, 'tmp_pollinations_status.json');

const TARGET_COUNT = 1000;
const DELAY_MS = 2000; // Pollinations AIは制限が緩いため2秒間隔で高速処理可能

interface Status {
  totalGenerated: number;
}

// フォルダ作成
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 進捗ロード
let status: Status = { totalGenerated: 0 };
if (fs.existsSync(STATUS_FILE)) {
  try {
    status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  } catch (err) {
    console.warn('⚠️ ステータスファイルの読み込みに失敗しました。新規に開始します。');
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const saveStatus = () => {
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), 'utf8');
};

// プロンプト多様化のためのランダム要素定義
const HAIRSTYLES = [
  'bob cut hair',
  'long straight hair',
  'wavy long hair',
  'ponytail hair',
  'short hair',
  'half-up hairstyle',
];
const EXPRESSIONS = [
  'smiling',
  'gentle smile',
  'cheerful laughing',
  'calm looking at camera',
  'winking playfully',
];
const OUTFITS = [
  'casual t-shirt',
  'cozy knitted sweater',
  'stylish denim jacket',
  'elegant summer dress',
  'office white blouse',
];
const BACKGROUNDS = [
  'inside a cozy cafe',
  'in a sunny green park',
  'on a modern city street',
  'in a library surrounded by books',
  'in a bright room with soft window light',
];
const AGES = ['21 years old', '24 years old', '27 years old'];

const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const generatePrompt = (): string => {
  const age = getRandomElement(AGES);
  const expression = getRandomElement(EXPRESSIONS);
  const outfit = getRandomElement(OUTFITS);
  const hairstyle = getRandomElement(HAIRSTYLES);
  const background = getRandomElement(BACKGROUNDS);

  // 英語の高品質プロンプト
  return `A beautiful and cute Japanese woman, ${age}, ${expression}, wearing ${outfit}, ${hairstyle}, ${background}, realistic photo, masterpiece, 8k resolution, highly detailed skin texture, natural lighting`;
};

const downloadImage = async (index: number): Promise<boolean> => {
  const prompt = generatePrompt();
  console.log(`[${index}/${TARGET_COUNT}] 画像生成中...`);
  console.log(`📝 Prompt: "${prompt}"`);

  const url = `https://image.pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 45000, // 45秒タイムアウト
    });

    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
    const filename = `pollinations_${timestamp}_${Math.floor(100 + Math.random() * 900)}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(filepath, Buffer.from(response.data));
    console.log(`✅ 保存完了: ${filename}`);
    return true;
  } catch (err: any) {
    console.error(`❌ 生成失敗:`, err.message || err);
    return false;
  }
};

const main = async () => {
  console.log('====================================');
  console.log('🚀 Pollinations AI 画像量産スクリプト起動 (多様性対応・安定版)');
  console.log(`目標枚数: ${TARGET_COUNT}`);
  console.log(`現在の生成済み枚数: ${status.totalGenerated}`);
  console.log(`出力先: ${OUTPUT_DIR}`);
  console.log('====================================');

  let consecutiveErrors = 0;

  while (status.totalGenerated < TARGET_COUNT) {
    const success = await downloadImage(status.totalGenerated + 1);

    if (success) {
      status.totalGenerated++;
      saveStatus();
      consecutiveErrors = 0;
    } else {
      consecutiveErrors++;
      if (consecutiveErrors >= 5) {
        console.error('❌ 5回連続で生成に失敗したため、一時停止して30秒待ちます...');
        await sleep(30000);
        consecutiveErrors = 0;
      }
    }

    // 次のリクエストまで待機
    await sleep(DELAY_MS);
  }

  console.log('🎉 すべての画像生成が完了しました！');
};

main();
