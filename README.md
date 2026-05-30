# 好みズレ診断 (Taste Compass)

「AI生成の架空成人女性ビジュアルをスワイプして、自分の好みが世間とどれくらいズレているかを診断するサービス」のクロスプラットフォーム（Web優先）本番運用向け実装です。

将来的な iOS / Android アプリ化を見据え、**React Native Web + Expo 56 + Expo Router** を基盤に採用しつつ、初期公開に向けてWebでの表示・動作の完成度とセキュリティを極限まで高めています。

---

## 🌟 プロジェクトの特徴と倫理設計

1. **性的・不適切表現の排除**
   - 診断に使用される画像は、実在の人物ではなくすべて **20歳以上のAI生成架空ビジュアル** に制限されています。
   - 美醜の絶対的評価や性的ランク付けを徹底的に排除し、「好き」「スキップ」という健全な基準で好みの「ズレ（一致度）」を統計的に算出します。
2. **WebファーストのプレミアムUI/UX**
   - モバイルブラウザ：親指が自然に届く配置のカード＆アクションボタン。
   - PCブラウザ：左右矢印キー（キーボード）やマウスドラッグによる直感的なスワイプ操作に対応。
   - HSL調和のダークパレットと、滑らかなマイクロアニメーションによるプレミアムな操作感。
3. **完全匿名性**
   - ユーザー登録やログインは一切不要。AsyncStorageを用いた匿名UUIDの自動生成により、完全匿名で過去履歴のローカル永続化とSupabase同期を両立します。

---

## 🛠️ 技術スタック

- **フロントエンド**: React Native (Web/Native), Expo 56, Expo Router, Zustand (状態管理)
- **データベース & セキュリティ**: Supabase (PostgreSQL, Row Level Security)
- **静的検証・Linter**: TypeScript Strict Mode, ESLint, Prettier
- **テスト**: Jest (Unit / Logic), Playwright (Web E2E)

---

## 📦 フォルダ構成

```text
├── app/                  # Expo Router 準拠の画面ルーティング (各画面コンポーネント)
├── src/
│   ├── components/       # 共通コンポーネント (SwipeCard, AdSlotなど)
│   ├── lib/              # プラットフォーム定義、Supabaseクライアント、環境変数
│   ├── services/         # ビジネスロジック (スコアリング、セッション、DB同期等)
│   ├── stores/           # Zustand によるグローバル状態管理 (診断進行、ユーザーID)
│   └── theme/            # プレミアムテーマカラー、シャドウ、フォント定義
├── supabase/             # Supabase DB 設定用のSQLスクリプト群
├── tests/
│   ├── unit/             # ユニットテスト (スコアリング、匿名ID、履歴マージ)
│   └── e2e/              # Playwright による統合E2Eテスト
└── scripts/              # 画像メタデータの静的整合性検証スクリプト
```

---

## 🚀 ローカル開発環境のセットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成します。

```bash
cp .env.example .env
```

`.env` 内に必要な接続情報を設定してください：

- `EXPO_PUBLIC_SUPABASE_URL`: Supabase プロジェクトの URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase の `anon` パブリックキー

> [!NOTE]
> **ローカルモックモード**:  
> 環境変数が未設定（プレースホルダー値のまま）である場合、アプリは自動的に **ローカルデモモックモード** として動作します。Supabase接続をバイパスして即座に AsyncStorage 上にデータをフォールバックさせるため、DBがない状態でもスムーズに診断や履歴の動作確認が可能です。

### 3. 開発サーバーの起動

Web開発用：

```bash
npm run web
```

※ Node.js v26環境下でのモジュール解決バグを回避するため、内部的に直接 Expo CLI のエントリポイントを実行するスクリプトとなっています。

iOS / Android (シミュレータ・実機) 用：

```bash
npm run ios
npm run android
```

---

## 🗄️ データベースとセキュリティ (Supabase)

Supabaseで新規プロジェクトを作成後、`supabase/` ディレクトリ内のSQLファイルを以下の順番で SQL Editor に貼り付けて実行してください。

1. **[schema.sql](file:///Volumes/MOVESPEED/Documents/GitHub/taste-compass/supabase/schema.sql)**
   - テーブル群 (`images`, `votes`, `diagnosis_sessions`, `results`, `reports`, `app_events`) の作成。
2. **[policies.sql](file:///Volumes/MOVESPEED/Documents/GitHub/taste-compass/supabase/policies.sql)**
   - Row Level Security (RLS) の適用。匿名ユーザー (`anon` ロール) に対し、データの参照および自己所有データ（匿名ID一致）のみのアクセス制限を実施。
3. **[views.sql](file:///Volumes/MOVESPEED/Documents/GitHub/taste-compass/supabase/views.sql)**
   - スコア計算用の中間集計ビューの作成。
4. **[functions.sql](file:///Volumes/MOVESPEED/Documents/GitHub/taste-compass/supabase/functions.sql)**
   - 各画像の統計的Like率や集計を高速取得するための RPC (Remote Procedure Call) 関数の定義。
5. **[seed.sql](file:///Volumes/MOVESPEED/Documents/GitHub/taste-compass/supabase/seed.sql)**
   - 診断画像30枚の初期シードデータ。実環境にデプロイする際は、画像を Supabase Storage バケット `images` 内にアップロードし、その公開 URL を `image_url` に反映させてください。

### 🔒 Row Level Security (RLS) ポリシーの要約

本番環境では、すべての書き込み・読み込みに厳格なRLSを適用しています：

- `images`: 誰でも参照のみ可能。
- `votes`, `diagnosis_sessions`, `reports`, `app_events`: 匿名ユーザーからの新規挿入 (INSERT) のみを許可（他人のデータは読み書き不可能）。
- `results`: 自身の `anonymous_user_id` と一致する診断結果レコードのみ、参照 (SELECT) および保存 (INSERT) を許可。

---

## 📈 広告収益化 (AdSlot) の設計

本番リリースに向けて、[AdSlot.tsx](file:///Volumes/MOVESPEED/Documents/GitHub/taste-compass/src/components/ad/AdSlot.tsx) を使った広告挿入設計が行われています。

- `EXPO_PUBLIC_ENABLE_ADS=true` に設定すると、Web環境では指定した広告プレースホルダー枠（Google AdSense等）が自動的に活性化されます。
- 配置箇所：
  1. ホーム画面下部
  2. 結果画面下部
  3. 履歴画面フッター
- 本番公開時には、`AdSlot.tsx` 内部を Google AdSense (Web) または Google Mobile Ads SDK (Native) に差し替えるだけで、全ての画面の広告枠を一括で制御・収益化できます。

---

## 🧪 テスト・品質検証

本番公開に耐えうる品質を確保するため、検証スクリプトが用意されています。

### 1. 静的解析・フォーマット・ユニットテストの一括検証

以下の統合コマンドを実行することで、TS型チェック、ESLint、Prettier、Jestによる全ユニットテスト、画像メタデータの構造整合性検証をノーエラー・ノーワーニングで検証します。

```bash
npm run validate:all
```

- **型チェック**: `node node_modules/typescript/lib/tsc.js --noEmit`
- **Lint**: `eslint . --ext .js,.jsx,.ts,.tsx`
- **ユニットテスト**: `jest` (診断スコアリングロジック、履歴のサーバー・ローカルマージマージ処理などの正確性を検証)
- **メタデータ検証**: `ts-node scripts/validate-metadata.ts` (画像メタデータに性的・不適切なキーワードが含まれていないか厳密にチェック)

### 2. Playwright E2E テストの実行

ヘッドレスブラウザを用いて「ホーム → 設定 → 30枚スワイプ診断 → 結果画面 → 履歴画面での記録確認」までの一連のユーザーフローを完全に自動でテストします。

```bash
# 必要に応じてPlaywrightブラウザのインストール
npx playwright install

# E2Eテストの実行 (自動でWebサーバーが起動し、エミュレート検証が行われます)
npm run test:e2e:web
```

---

## 🌐 Webの本番デプロイ手順

### 1. 静的ファイルのビルド (Export)

Expo Router プロジェクトをWeb用に静的ファイルとしてエクスポートします。

```bash
npx expo export --platform web
```

ビルド完了後、ルート直下の `dist/` ディレクトリ内に HTML, JS, CSS などの静的成果物が生成されます。

### 2. ホスティングへのデプロイ

Vercel, Cloudflare Pages, GitHub Pages, Firebase Hosting などお好みのプラットフォームへ `dist/` の内容をデプロイしてください。

**SPAルーティング設定に関する注意 (重要)**  
Expo Router はクライアントサイドでルーティングを行うため、ホスティングサーバー側で「存在しないパスへのアクセスをすべて `index.html` にリダイレクトする (Rewrites / Fallback)」設定を行ってください。

- **Vercel** (`vercel.json`):
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- **Firebase Hosting** (`firebase.json`):
  ```json
  {
    "hosting": {
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  }
  ```

---

## 📱 ストア公開に向けたアプリ化手順 (EAS Build)

将来的に App Store / Google Play で公開する際は、**EAS (Expo Application Services)** を利用してビルドおよび提出を行います。

### 1. EAS CLI のインストールとログイン

```bash
npm install -g eas-cli
eas login
```

### 2. EAS プロジェクトの初期設定

```bash
eas build:configure
```

画面の指示に従い、iOS / Android それぞれのビルド設定を生成します (`eas.json` が追加されます)。

### 3. ストア公開ビルドの実行

iOS (App Store 配信用):

```bash
eas build --platform ios --profile production
```

Android (Google Play AAB配信用):

```bash
eas build --platform android --profile production
```

※ 初回ビルド時には、Apple Developer アカウントや Google Play Console デベロッパー資格情報の作成・紐付けが必要になります。

---

## 🛡️ 本番運用チェックリスト

- [ ] **環境変数の厳密な確認**  
       クライアント用環境変数（`.env`）に管理用の特権APIキー（`service_role` 等）が誤って含まれていないか。
- [ ] **Supabase RLS ポリシーの有効化**  
       Supabaseのダッシュボードで、すべてのテーブルで RLS が有効（`Active`）になっているか。
- [ ] **コンテンツ削除・お問い合わせフロー**  
       ユーザーから「実在人物への酷似」「不適切表現」の報告（`reports` テーブルへインサート）があった際、速やかにその画像を非表示（`images` テーブルのフラグ管理、または直接削除）にする運用手順が整備されているか。
- [ ] **ストレージとCDNのキャッシュ設定**  
       画像を取得する Supabase Storage バケットの `Cache-Control` ヘッダーが適切に設定され、画像の遅延ロードが最小限になっているか。
