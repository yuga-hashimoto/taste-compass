// diagnosis.spec.ts - 診断フローのE2Eテスト
import { test, expect } from '@playwright/test';

test.describe('Taste Compass E2E Diagnosis Flow', () => {
  test('should complete the entire diagnosis flow on Web', async ({ page }) => {
    // 1. ホーム画面へのアクセス
    await page.goto('/?mock=true');

    // タイトルの確認
    await expect(page.locator('text=世間とズレてる？')).toBeVisible();
    await expect(page.locator('text=スワイプするだけで好みを多角的に分析。')).toBeVisible();

    // 診断を始めるボタンをクリック
    const startSetupBtn = page.getByLabel('診断スタート');
    await expect(startSetupBtn).toBeVisible();
    await startSetupBtn.click({ force: true });

    // 2. 診断設定画面の確認と開始
    await expect(page).toHaveURL(/.*setup/);
    await expect(page.getByText('診断枚数')).toBeVisible();

    // デフォルト30枚で「診断スタート」をクリック
    const startDiagBtn = page.getByRole('button', { name: /診断スタート/ });
    await expect(startDiagBtn).toBeVisible();
    await startDiagBtn.click();

    // 3. スワイプ診断画面の動作
    await expect(page).toHaveURL(/.*diagnosis/);

    // 画像ロード後の表示確認 (「0 / 30 枚」などのヘッダーテキストの存在)
    await expect(page.locator('text=0 / 30 枚')).toBeVisible({ timeout: 15000 });

    // スワイプをシミュレートするために「好き」「スキップ」ボタンを合計30回クリック
    const likeBtn = page.getByLabel('この画像が好き');
    const skipBtn = page.getByLabel('この画像をスキップ');

    // 30回分の投票を実行
    for (let i = 0; i < 30; i++) {
      // 最初の3回はマウスドラッグによるスワイプ操作をシミュレート
      if (i < 3) {
        const card = page.locator('[data-testid="swipe-card"]').first();
        await expect(card).toBeVisible();
        const box = await card.boundingBox();
        if (box) {
          const startX = box.x + box.width / 2;
          const startY = box.y + box.height / 2;
          const endX = i % 2 === 0 ? startX + 180 : startX - 180;
          await page.mouse.move(startX, startY);
          await page.mouse.down();
          await page.mouse.move(endX, startY, { steps: 5 });
          await page.mouse.up();
          await page.waitForTimeout(600); // アニメーションが完全に終わるのを待つ
        }
      } else {
        // 残りの27回はボタンクリックで高速進行
        if (i % 2 === 0) {
          await likeBtn.click();
        } else {
          await skipBtn.click();
        }
        await page.waitForTimeout(200); // 状態保存とカード再生成のバッファ
      }
    }

    // 4. 結果画面の確認
    await expect(page).toHaveURL(/.*result\/sess_.*/, { timeout: 15000 });
    await expect(page.locator('text=あなたの好みタイプ')).toBeVisible();
    await expect(page.locator('text=世間との一致度')).toBeVisible();
    await expect(page.getByText('王道派').first()).toBeVisible();

    // ホームに戻るをクリック
    const backHomeBtn = page.locator('text=ホームに戻る');
    await expect(backHomeBtn).toBeVisible();
    await backHomeBtn.click();

    // 5. 履歴の確認
    await page.goto('/history');
    await expect(page).toHaveURL(/.*history/);
    // 診断が完了した結果履歴がリストに存在するはず
    await expect(page.locator('text=一致')).toBeVisible();
  });
});
