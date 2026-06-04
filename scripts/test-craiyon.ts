import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '../public/images/tmp_craiyon');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
  console.log('🌐 ヘッドレス Chromiumブラウザを起動しています...');
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo'
  });
  const page = await context.newPage();
  page.setDefaultTimeout(120000); // 2分タイムアウト

  try {
    console.log('🌐 Craiyon にアクセス中...');
    await page.goto('https://www.craiyon.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    const promptSelector = 'textarea#prompt, input#prompt, textarea[placeholder*="prompt" i]';
    await page.waitForSelector(promptSelector, { timeout: 15000 });
    const promptInput = await page.$(promptSelector);
    if (!promptInput) {
      throw new Error('プロンプト入力欄が見つかりません。');
    }
    
    const prompt = "A beautiful and cute Japanese woman, 20s, smiling, wearing casual t-shirt, bob cut hair, inside a cozy cafe, realistic photo, highly detailed, natural lighting";
    await promptInput.fill(prompt);
    console.log(`✍️ プロンプトを入力しました: ${prompt}`);

    // レスポンス待機プロミスを先にセットアップ
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/image/draw') && response.status() === 200,
      { timeout: 120000 }
    );

    const drawButtonSelector = 'button:has-text("Draw"), button#generate, button[type="submit"]';
    await page.waitForSelector(drawButtonSelector, { timeout: 10000 });
    const drawButton = await page.$(drawButtonSelector);
    if (!drawButton) {
      throw new Error('Draw ボタンが見つかりません。');
    }
    await drawButton.click();
    console.log('👆 Draw ボタンをクリックしました。生成完了を待っています (最大2分)...');

    const response = await responsePromise;
    const result = await response.json();
    const results = result?.results;
    if (!results || !Array.isArray(results) || results.length === 0) {
      throw new Error('画像データがレスポンスに含まれていません。');
    }

    const imageUrl = results[0].url;
    console.log(`🔗 画像生成成功: ${imageUrl}`);

    console.log(`📥 画像データをダウンロード中...`);
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

    const buffer = Buffer.from(base64Data, 'base64');
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
    const filename = `gemini_test_${timestamp}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(filepath, buffer);
    console.log(`✅ 保存完了: ${filename}`);

  } catch (err: any) {
    console.error('❌ エラーが発生しました:', err.message || err);
    // エラー時のスクリーンショットを撮ってデバッグに役立てる
    try {
      await page.screenshot({ path: path.join(__dirname, 'error_screenshot.png') });
      console.log('📸 エラー時のスクリーンショットを scripts/error_screenshot.png に保存しました。');
    } catch (ssErr) {
      console.error('❌ スクリーンショット保存失敗:', ssErr);
    }
  } finally {
    await browser.close();
    console.log('🚪 ブラウザを終了しました。');
  }
}

main();
