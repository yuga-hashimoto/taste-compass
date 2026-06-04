-- policies.sql - RLS (Row Level Security) ポリシー設定

-- すべてのテーブルのRLSを有効化
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

-- 1. images テーブルのポリシー
-- 誰でも（匿名ユーザーでも）アクティブで安全性が承認された画像のみ閲覧可能
CREATE POLICY select_approved_images ON public.images
  FOR SELECT
  TO anon, authenticated
  USING (active = true AND safety_status = 'approved');

-- 管理者のみ全操作可能 (service_role)
CREATE POLICY admin_all_images ON public.images
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- 2. votes テーブルのポリシー
-- 誰でも投票をインサート可能 (診断中の投票データ)
CREATE POLICY insert_votes ON public.votes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 管理者のみ閲覧・更新・削除可能
CREATE POLICY admin_all_votes ON public.votes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- 3. diagnosis_sessions テーブルのポリシー
-- 誰でもセッションをインサート可能
CREATE POLICY insert_sessions ON public.diagnosis_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 誰でも自分のセッションをアップデート可能 (completed_countの更新など)
CREATE POLICY update_sessions ON public.diagnosis_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 誰でもセッションを取得可能 (クライアント側でanonymous_user_idで絞り込む)
CREATE POLICY select_sessions ON public.diagnosis_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 管理者ポリシー
CREATE POLICY admin_all_sessions ON public.diagnosis_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- 4. results テーブルのポリシー
-- 誰でも診断結果をインサート可能
CREATE POLICY insert_results ON public.results
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 結果の取得 (誰でもselect可能にするが、クライアント側でanonymous_user_idでフィルタリング)
CREATE POLICY select_results ON public.results
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 管理者ポリシー
CREATE POLICY admin_all_results ON public.results
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- 5. reports テーブルのポリシー
-- 誰でも不適切画像の報告をインサート可能
CREATE POLICY insert_reports ON public.reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 管理者ポリシー
CREATE POLICY admin_all_reports ON public.reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- 6. app_events テーブルのポリシー
-- 誰でも匿名ログイベントをインサート可能
CREATE POLICY insert_app_events ON public.app_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 管理者ポリシー
CREATE POLICY admin_all_app_events ON public.app_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- 7. image_country_stats テーブルのポリシー
-- RLSを有効化
ALTER TABLE public.image_country_stats ENABLE ROW LEVEL SECURITY;

-- 誰でも（匿名ユーザーでも）国別の統計データを閲覧可能にする
CREATE POLICY select_image_country_stats ON public.image_country_stats
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 管理者のみ全操作可能にする (service_role)
CREATE POLICY admin_all_image_country_stats ON public.image_country_stats
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
