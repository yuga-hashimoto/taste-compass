-- schema.sql - 好みズレ診断のテーブル定義

-- UUID生成用拡張機能（通常デフォルトで有効ですが念のため）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. images テーブル
CREATE TABLE IF NOT EXISTS public.images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  storage_path text,
  title text,
  style_group text NOT NULL,
  tags text[] NOT NULL,
  regional_style text,
  skin_tone text,
  hair_texture text,
  fashion_culture text,
  body_silhouette text,
  bust_impression text,
  height_impression text,
  overall_style text,
  popularity_score integer DEFAULT 50,
  active boolean DEFAULT true,
  safety_status text DEFAULT 'approved',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. diagnosis_sessions テーブル (votesの外部キーとして参照するため先に定義)
CREATE TABLE IF NOT EXISTS public.diagnosis_sessions (
  id text PRIMARY KEY, -- クライアント側で生成するセッションID
  anonymous_user_id text NOT NULL,
  status text NOT NULL, -- 'active', 'completed', 'abandoned'
  total_images integer NOT NULL,
  completed_count integer DEFAULT 0,
  platform text, -- 'ios', 'android', 'web'
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- 3. image_country_stats テーブル (国別の画像投票集計データ)
CREATE TABLE IF NOT EXISTS public.image_country_stats (
  image_id uuid REFERENCES public.images(id) ON DELETE CASCADE,
  country_code text NOT NULL, -- 言語ロケールコード
  like_count integer DEFAULT 0,
  skip_count integer DEFAULT 0,
  PRIMARY KEY (image_id, country_code)
);

-- 4. votes テーブル
CREATE TABLE IF NOT EXISTS public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_user_id text NOT NULL,
  session_id text NOT NULL,
  image_id uuid REFERENCES public.images(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('like', 'skip')),
  platform text,
  created_at timestamptz DEFAULT now()
);

-- 4. results テーブル
CREATE TABLE IF NOT EXISTS public.results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_user_id text NOT NULL,
  session_id text NOT NULL REFERENCES public.diagnosis_sessions(id) ON DELETE CASCADE,
  compatibility_score integer NOT NULL,
  preference_type text NOT NULL,
  mainstream_score integer,
  uniqueness_score integer,
  summary_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 5. reports テーブル
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_user_id text,
  image_id uuid REFERENCES public.images(id) ON DELETE SET NULL,
  report_type text NOT NULL, -- 'inappropriate', 'resemblance', 'other'
  message text,
  status text DEFAULT 'open', -- 'open', 'resolved', 'ignored'
  created_at timestamptz DEFAULT now()
);

-- 6. app_events テーブル
CREATE TABLE IF NOT EXISTS public.app_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_user_id text,
  event_name text NOT NULL,
  event_payload jsonb,
  platform text,
  created_at timestamptz DEFAULT now()
);

-- インデックスの作成 (検索パフォーマンス向上)
CREATE INDEX IF NOT EXISTS idx_images_active_safety ON public.images(active, safety_status);
CREATE INDEX IF NOT EXISTS idx_votes_session_id ON public.votes(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_anonymous_user_id ON public.votes(anonymous_user_id);
CREATE INDEX IF NOT EXISTS idx_results_anonymous_user_id ON public.results(anonymous_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_anonymous_user_id ON public.diagnosis_sessions(anonymous_user_id);
