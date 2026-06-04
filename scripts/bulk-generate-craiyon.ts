import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '../public/images/tmp_craiyon');
const STATUS_FILE = path.resolve(__dirname, 'tmp_craiyon_status.json');

const TARGET_COUNT = 1000;
const DELAY_MS = 8000; // UIエミュレーションのため少しウェイトを入れる

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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const saveStatus = () => {
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), 'utf8');
};

const generateImageViaUI = async (page: Page, index: number): Promise<boolean> => {
  console.log(`[${index}/${TARGET_COUNT}] Craiyon画像生成中 (UIエミュレーション)...`);
  try {
    // 1. プロンプト入力欄に入力
    const promptSelector = 'textarea#prompt, input#prompt, textarea[placeholder*="prompt" i]';
    await page.waitForSelector(promptSelector, { timeout: 15000 });
    const promptInput = await page.$(promptSelector);
    if (!promptInput) {
      throw new Error('プロンプト入力欄が見つかりません。');
    }
    
    // 入力欄をクリアしてから入力
    await promptInput.fill('');
    await promptInput.fill('可愛い日本人');

    // 2. レスポンス待機プロミスを先にセットアップ
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/image/draw') && response.status() === 200,
      { timeout: 120000 } // 2分タイムアウト
    );

    // 3. Draw ボタンをクリック
    const drawButtonSelector = 'button:has-text("Draw"), button#generate, button[type="submit"]';
    await page.waitForSelector(drawButtonSelector, { timeout: 10000 });
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
      return false;
    }

    const imageUrl = results[0].url;
    console.log(`🔗 画像生成成功: ${imageUrl}`);

    // 5. 画像のダウンロード
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
    const filename = `craiyon_${timestamp}_${Math.floor(100 + Math.random() * 900)}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(filepath, buffer);
    console.log(`✅ 保存完了: ${filename}`);
    return true;
  } catch (err: any) {
    console.error(`❌ 生成失敗:`, err.message || err);
    return false;
  }
};

const main = async () => {
  console.log('====================================');
  console.log('🚀 Craiyon 画像量産スクリプト起動 (UI Emulation版)');
  console.log(`目標枚数: ${TARGET_COUNT}`);
  console.log(`現在の生成済み枚数: ${status.totalGenerated}`);
  console.log(`出力先: ${OUTPUT_DIR}`);
  console.log('====================================');

  console.log('🌐 Chromiumブラウザを起動しています (headless: false)...');
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await chromium.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'ja-JP',
      timezoneId: 'Asia/Tokyo'
    });
    
    page = await context.newPage();
    page.setDefaultTimeout(120000); 

    let consecutiveErrors = 0;

    while (status.totalGenerated < TARGET_COUNT) {
      console.log('🌐 Craiyon にアクセス中...');
      try {
        await page.goto('https://www.craiyon.com/', { waitUntil: 'domcontentloaded' });
        await sleep(4000); // ページのロード完了後、少し待つ
      } catch (gotoErr: any) {
        console.error('❌ ページの読み込みに失敗しました:', gotoErr.message);
        consecutiveErrors++;
        if (consecutiveErrors >= 5) {
          console.error('❌ 連続エラーのため30秒スリープします...');
          await sleep(30000);
          consecutiveErrors = 0;
        }
        await sleep(5000);
        continue;
      }

      const success = await generateImageViaUI(page, status.totalGenerated + 1);

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
  } catch (err: any) {
    console.error('❌ 致命的なエラーが発生しました:', err.message || err);
  } finally {
    if (browser) {
      console.log('🚪 ブラウザを終了します。');
      await browser.close();
    }
  }
};

main();
