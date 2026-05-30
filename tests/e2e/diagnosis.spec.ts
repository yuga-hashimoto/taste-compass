// diagnosis.spec.ts - 診断フローのE2Eテスト
import { test, expect } from '@playwright/test';

test.describe('Taste Compass E2E Diagnosis Flow', () => {
  test('should complete the entire diagnosis flow on Web', async ({ page }) => {
    // 1. ホーム画面へのアクセス
    await page.goto('/');

    // タイトルの確認
    await expect(page.locator('text=好みズレ診断')).toBeVisible();
    await expect(page.locator('text=世間の好みとあなたのズレを測定する')).toBeVisible();

    // 診断を始めるボタンをクリック
    const startSetupBtn = page.getByLabel('診断設定画面へ進む');
    await expect(startSetupBtn).toBeVisible();
    await startSetupBtn.click();

    // 2. 診断設定画面の確認と開始
    await expect(page).toHaveURL(/.*setup/);
    await expect(page.locator('text=1. 診断枚数を選択')).toBeVisible();
    await expect(page.locator('text=2. 診断テーマを選択')).toBeVisible();

    // デフォルト30枚で「診断スタート」をクリック
    const startDiagBtn = page.getByLabel('診断を開始する');
    await expect(startDiagBtn).toBeVisible();
    await startDiagBtn.click();

    // 3. スワイプ診断画面の動作
    await expect(page).toHaveURL(/.*diagnosis/);

    // 画像ロード後の表示確認 (「0 / 30 枚」などのヘッダーテキストの存在)
    await expect(page.locator('text=0 / 30 枚')).toBeVisible({ timeout: 15000 });

    // スワイプをシミュレートするために「好き」「スキップ」ボタンを合計30回クリック
    const likeBtn = page.getByLabel('この画像が好き');
    const skipBtn = page.getByLabel('この画像をスキップ');

    await expect(likeBtn).toBeVisible();
    await expect(skipBtn).toBeVisible();

    // 30回分の投票を実行
    for (let i = 0; i < 30; i++) {
      // 奇数番目はLike、偶数番目はSkipをクリックしてテストの多様性を持たせる
      if (i % 2 === 0) {
        await likeBtn.click();
      } else {
        await skipBtn.click();
      }
      // 進行状況が適切に上がっているか確認
      await page.waitForTimeout(100); // アニメーションとDB保存のバッファ
    }

    // 4. 結果画面の確認
    await expect(page).toHaveURL(/.*result\/sess_.*/, { timeout: 15000 });
    await expect(page.locator('text=あなたの診断結果')).toBeVisible();
    await expect(page.locator('text=世間との一致度')).toBeVisible();
    await expect(page.locator('text=王道寄り')).toBeVisible();

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
