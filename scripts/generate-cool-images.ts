import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '../public/images/tmp_craiyon');

// フォルダ作成
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const PROMPTS = [
  "A beautiful and cute Japanese woman, late 20s, cool expression, wearing leather jacket and T-shirt, short hair, on a city street, realistic photo, highly detailed, natural lighting",
  "A beautiful and cute Japanese woman, mid 20s, serious expression, wearing simple black knit, long straight hair, in a monotone studio, realistic photo, highly detailed, natural lighting",
  "A beautiful and cute Japanese woman, late 20s, smiling with an adult atmosphere, wearing a stylish setup, wavy hair, on a high-rise building terrace, realistic photo, highly detailed, natural lighting",
  "A beautiful and cute Japanese woman, late 20s, mysterious expression, wearing dark tone clothes, bob hair, in a modern bar, realistic photo, highly detailed, natural lighting",
  "A beautiful and cute Japanese woman, mid 20s, active expression, wearing sporty jacket, ponytail hair, with a concrete background, realistic photo, highly detailed, natural lighting"
];

function getFormattedTimestamp() {
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${YYYY}${MM}${DD}_${HH}${mm}${ss}`;
}

const generateAndDownload = async (prompt: string, index: number) => {
  console.log(`[${index + 1}/${PROMPTS.length}] 画像生成中...`);
  console.log(`📝 Prompt: "${prompt}"`);

  const seed = Math.floor(Math.random() * 1000000);
  const url = `https://image.pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000 // 60秒タイムアウト
    });

    const timestamp = getFormattedTimestamp();
    const rand = Math.floor(100 + Math.random() * 900);
    const filename = `gemini_${timestamp}_${rand}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(filepath, Buffer.from(response.data));
    console.log(`✅ 保存完了: ${filename}`);
    return filename;
  } catch (err: any) {
    console.error(`❌ 生成失敗:`, err.message || err);
    return null;
  }
};

const main = async () => {
  console.log('====================================');
  console.log('🚀 クール・大人っぽい・シンプル系 画像生成スクリプト起動');
  console.log(`出力先: ${OUTPUT_DIR}`);
  console.log('====================================');

  const generatedFiles: string[] = [];

  for (let i = 0; i < PROMPTS.length; i++) {
    const filename = await generateAndDownload(PROMPTS[i], i);
    if (filename) {
      generatedFiles.push(filename);
    }
    if (i < PROMPTS.length - 1) {
      await sleep(3000);
    }
  }

  console.log('====================================');
  console.log('🎉 処理完了しました！');
  console.log('生成されたファイル一覧:');
  generatedFiles.forEach(file => console.log(`- ${file}`));
  console.log('====================================');
  
  // ファイル一覧を出力するためのJSONファイルを一時的に作成して、呼び出し側で読み取れるようにするか、
  // あるいは標準出力からパースできるようにします。
  fs.writeFileSync(path.resolve(__dirname, 'last_generated_cool_images.json'), JSON.stringify(generatedFiles, null, 2), 'utf8');
};

main();
