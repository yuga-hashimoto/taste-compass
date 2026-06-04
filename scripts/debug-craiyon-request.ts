import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🌐 デバッグ用 Chromiumブラウザを起動しています（画面表示あり）...');
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  });
  const page = await context.newPage();

  // ネットワークリクエストの監視
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('draw') || url.includes('api')) {
      console.log(`\n➡️ [Request]`);
      console.log(`URL: ${url}`);
      console.log(`Method: ${request.method()}`);
      console.log(`Headers:`, JSON.stringify(request.headers(), null, 2));
      const postData = request.postData();
      if (postData) {
        console.log(`PostData: ${postData}`);
      }
    }
  });

  // ネットワークレスポンスの監視
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('draw') || url.includes('api')) {
      console.log(`\n⬅️ [Response]`);
      console.log(`URL: ${url}`);
      console.log(`Status: ${response.status()}`);
      try {
        const text = await response.text();
        console.log(`ResponseBody (first 200 chars): ${text.substring(0, 200)}...`);
      } catch (err) {
        console.log(`Could not read response body:`, err);
      }
    }
  });

  console.log('🌐 Craiyon にアクセス中...');
  await page.goto('https://www.craiyon.com/');

  console.log('💡 ブラウザが開きました。自動で画像生成を試みます。');

  try {
    // プロンプト入力欄を探して入力
    // 通常、textarea や input があります。placeholder や id で探します。
    await page.waitForSelector('textarea#prompt, input#prompt, textarea[placeholder*="prompt" i]', {
      timeout: 10000,
    });
    const promptInput = await page.$(
      'textarea#prompt, input#prompt, textarea[placeholder*="prompt" i]',
    );
    if (promptInput) {
      await promptInput.fill('可愛い日本人');
      console.log('✍️ プロンプト「可愛い日本人」を入力しました。');

      // 生成ボタンを探してクリック
      // 通常、テキストが「Draw」であるボタンなどがあります。
      const drawButton = await page.$(
        'button:has-text("Draw"), button#generate, button[type="submit"]',
      );
      if (drawButton) {
        await drawButton.click();
        console.log('👆 Draw ボタンをクリックしました。画像生成の通信を監視中...');
      } else {
        console.log('⚠️ Draw ボタンが見つかりませんでした。手動でクリックしてください。');
      }
    }
  } catch (err) {
    console.log('⚠️ 自動入力・クリックに失敗しました。手動で操作してください。', err);
  }

  console.log('⏳ 60秒間、通信を監視します。手動で生成ボタンを押しても構いません。');
  await page.waitForTimeout(60000);

  console.log('🚪 ブラウザを終了します。');
  await browser.close();
}

main().catch((err) => {
  console.error('❌ エラー:', err);
});
