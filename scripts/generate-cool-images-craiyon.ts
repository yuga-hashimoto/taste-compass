import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const PROMPTS = [
  'A beautiful Japanese woman in her late 20s, cool expression, wearing a leather jacket and T-shirt, short hair, on a city street, realistic photo, highly detailed, natural lighting',
  'A beautiful Japanese woman in her mid 20s, serious expression, wearing a simple black knit, long straight hair, in a monotone studio, realistic photo, highly detailed, natural lighting',
  'A beautiful Japanese woman in her late 20s, smiling with an adult atmosphere, wearing a stylish setup, wavy hair, on a high-rise building terrace, realistic photo, highly detailed, natural lighting',
  'A beautiful Japanese woman in her late 20s, mysterious expression, wearing dark tone clothes, bob hair, in a modern bar, realistic photo, highly detailed, natural lighting',
  'A beautiful Japanese woman in her mid 20s, active expression, wearing a sporty jacket, ponytail hair, with a concrete background, realistic photo, highly detailed, natural lighting',
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

const generateImageViaUI = async (
  page: Page,
  prompt: string,
  index: number,
): Promise<string | null> => {
  console.log(`[${index + 1}/${PROMPTS.length}] Craiyon画像生成中...`);
  console.log(`📝 Prompt: "${prompt}"`);

  try {
    // 1. プロンプト入力欄に入力
    const promptSelector = 'textarea#prompt, input#prompt, textarea[placeholder*="prompt" i]';
    await page.waitForSelector(promptSelector, { timeout: 20000 });
    const promptInput = await page.$(promptSelector);
    if (!promptInput) {
      throw new Error('プロンプト入力欄が見つかりません。');
    }

    // 入力欄をクリアしてから入力
    await promptInput.fill('');
    await promptInput.fill(prompt);

    // 2. レスポンス待機プロミスを先にセットアップ
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/image/draw') && response.status() === 200,
      { timeout: 180000 }, // 3分タイムアウト
    );

    // 3. Draw ボタンをクリック
    const drawButtonSelector = 'button:has-text("Draw"), button#generate, button[type="submit"]';
    await page.waitForSelector(drawButtonSelector, { timeout: 15000 });
    const drawButton = await page.$(drawButtonSelector);
    if (!drawButton) {
      throw new Error('Draw ボタンが見つかりません。');
    }
    await drawButton.click();
    console.log('👆 Draw ボタンをクリックしました。画像生成完了を待っています...');

    // 4. APIレスポンスを待つ
    const response = await responsePromise;
    const result = await response.json();

    const results = result?.results;
    if (!results || !Array.isArray(results) || results.length === 0) {
      console.error(`❌ 画像データがレスポンスに含まれていません:`, result);
      return null;
    }

    // 9つの画像の中から最初のもの（あるいはランダムに選んでも良い）
    const imageUrl = results[0]; // bulk-generate-craiyon.ts では results[0].url となっているが、実際は results が base64 の配列だったり、url のオブジェクトだったりします。
    // bulk-generate-craiyon.ts で `results[0].url` もしくは `results[0]` のどちらか。
    // bulk-generate-craiyon.ts L82: `const imageUrl = results[0].url;` もしくは `results[0]` の可能性があります。
    // debug-craiyon-request.ts などで確認したい。
    // 元の bulk-generate-craiyon.ts では results[0].url となっていますね。しかし、CraiyonのAPIが返すのはBase64画像の配列かもしれません。
    // 念のため、元の bulk-generate-craiyon.ts の記述を信じます。もし results[0] が文字列（base64等）ならそれをパースします。

    console.log(
      `🔗 取得した画像データ情報:`,
      typeof results[0] === 'object'
        ? JSON.stringify(results[0]).substring(0, 100)
        : String(results[0]).substring(0, 100),
    );

    let buffer: Buffer;
    if (typeof results[0] === 'string') {
      // Base64文字列の場合
      buffer = Buffer.from(results[0], 'base64');
    } else if (results[0] && typeof results[0] === 'object' && results[0].url) {
      // URLの場合、ダウンロードする
      const imageUrl = results[0].url;
      console.log(`📥 画像データをダウンロード中: ${imageUrl}`);
      const base64Data = await page.evaluate(async (url) => {
        const resp = await fetch(url);
        const blob = await resp.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const resultStr = reader.result as string;
            const base64 = resultStr.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }, imageUrl);
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      // それ以外（通常CraiyonはBase64文字列の配列を返すことがあったり、画像URLを返すことがあったりします。2024年のCraiyon APIは、Base64の文字列配列を results に格納して返します）
      // そのため、results[0] がBase64そのものである可能性が高い。
      // もし results[0] がBase64ならそのままBufferにします。
      buffer = Buffer.from(results[0], 'base64');
    }

    const timestamp = getFormattedTimestamp();
    const rand = Math.floor(100 + Math.random() * 900);
    const filename = `gemini_${timestamp}_${rand}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(filepath, buffer);
    console.log(`✅ 保存完了: ${filename}`);
    return filename;
  } catch (err: any) {
    console.error(`❌ 生成失敗:`, err.message || err);
    return null;
  }
};

const main = async () => {
  console.log('====================================');
  console.log('🚀 Craiyon クール系画像生成スクリプト起動');
  console.log(`出力先: ${OUTPUT_DIR}`);
  console.log('====================================');

  console.log('🌐 Chromiumブラウザを起動しています...');
  // ヘッドレスモードだとCloudflareに弾かれる可能性があるので、headless: false で起動します。
  // 必要に応じて headless: true に変更してください。
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  });

  const page = await context.newPage();
  page.setDefaultTimeout(180000);

  const generatedFiles: string[] = [];

  try {
    console.log('🌐 Craiyon にアクセス中...');
    await page.goto('https://www.craiyon.com/', { waitUntil: 'domcontentloaded' });
    await sleep(5000); // ページのロード完了後、少し待つ

    for (let i = 0; i < PROMPTS.length; i++) {
      const filename = await generateImageViaUI(page, PROMPTS[i], i);
      if (filename) {
        generatedFiles.push(filename);
      } else {
        console.log(`⚠️ プロンプト ${i + 1} の生成に失敗しました。再試行します...`);
        // 失敗した場合、一度ページをリロードして再試行
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sleep(5000);
        const retryFilename = await generateImageViaUI(page, PROMPTS[i], i);
        if (retryFilename) {
          generatedFiles.push(retryFilename);
        }
      }

      // 生成間のウェイト
      if (i < PROMPTS.length - 1) {
        console.log('⏳ 次の生成まで10秒待機します...');
        await sleep(10000);
      }
    }
  } catch (err: any) {
    console.error('❌ 致命的なエラーが発生しました:', err.message || err);
  } finally {
    console.log('🚪 ブラウザを終了します。');
    await browser.close();
  }

  console.log('====================================');
  console.log('🎉 すべての画像生成処理が完了しました！');
  console.log('生成されたファイル一覧:');
  generatedFiles.forEach((file) => console.log(`- ${file}`));
  console.log('====================================');

  fs.writeFileSync(
    path.resolve(__dirname, 'last_generated_cool_images.json'),
    JSON.stringify(generatedFiles, null, 2),
    'utf8',
  );
};

main();
