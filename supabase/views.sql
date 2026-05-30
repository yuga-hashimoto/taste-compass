-- views.sql - 集計用ビューの定義

-- 1. 画像ごとの投票統計 (実データがない場合は popularity_score をベースラインにする)
CREATE OR REPLACE VIEW public.image_stats AS
SELECT
  i.id AS image_id,
  i.style_group,
  i.regional_style,
  i.body_silhouette,
  i.tags,
  i.popularity_score,
  COALESCE(COUNT(v.id) FILTER (WHERE v.vote_type = 'like'), 0) AS like_count,
  COALESCE(COUNT(v.id) FILTER (WHERE v.vote_type = 'skip'), 0) AS skip_count,
  COUNT(v.id) AS total_votes,
  CASE
    -- 実投票が5票未満の場合は、実投票の傾向と初期スコア(popularity_score)をブレンドしてスコアの急激な変動を防ぐ
    WHEN COUNT(v.id) >= 5 THEN
      (COUNT(v.id) FILTER (WHERE v.vote_type = 'like')::float / COUNT(v.id)::float) * 100
    WHEN COUNT(v.id) > 0 THEN
      ((COUNT(v.id) FILTER (WHERE v.vote_type = 'like')::float / COUNT(v.id)::float) * 100 * 0.5) + (i.popularity_score::float * 0.5)
    ELSE
      i.popularity_score::float
  END AS like_rate
FROM public.images i
LEFT JOIN public.votes v ON i.id = v.image_id
WHERE i.active = true AND i.safety_status = 'approved'
GROUP BY i.id, i.style_group, i.regional_style, i.body_silhouette, i.tags, i.popularity_score;


-- 2. style_group ごとの平均 like_rate
CREATE OR REPLACE VIEW public.style_group_stats AS
SELECT
  style_group,
  AVG(like_rate) AS avg_like_rate,
  SUM(like_count) AS total_likes,
  SUM(total_votes) AS total_votes
FROM public.image_stats
GROUP BY style_group;


-- 3. regional_style ごとの平均 like_rate
CREATE OR REPLACE VIEW public.regional_style_stats AS
SELECT
  regional_style,
  AVG(like_rate) AS avg_like_rate,
  SUM(like_count) AS total_likes,
  SUM(total_votes) AS total_votes
FROM public.image_stats
WHERE regional_style IS NOT NULL
GROUP BY regional_style;


-- 4. body_silhouette ごとの平均 like_rate
CREATE OR REPLACE VIEW public.body_silhouette_stats AS
SELECT
  body_silhouette,
  AVG(like_rate) AS avg_like_rate,
  SUM(like_count) AS total_likes,
  SUM(total_votes) AS total_votes
FROM public.image_stats
WHERE body_silhouette IS NOT NULL
GROUP BY body_silhouette;


-- 5. タグごとの平均 like_rate (配列の要素を展開して集集計)
CREATE OR REPLACE VIEW public.tag_stats AS
WITH unnested_tags AS (
  SELECT
    UNNEST(tags) AS tag,
    like_rate,
    like_count,
    total_votes
  FROM public.image_stats
)
SELECT
  tag,
  AVG(like_rate) AS avg_like_rate,
  SUM(like_count) AS total_likes,
  SUM(total_votes) AS total_votes
FROM unnested_tags
GROUP BY tag;

-- ビューに対する読み取り許可を付与
ALTER VIEW public.image_stats OWNER TO postgres;
ALTER VIEW public.style_group_stats OWNER TO postgres;
ALTER VIEW public.regional_style_stats OWNER TO postgres;
ALTER VIEW public.body_silhouette_stats OWNER TO postgres;
ALTER VIEW public.tag_stats OWNER TO postgres;

GRANT SELECT ON public.image_stats TO anon, authenticated;
GRANT SELECT ON public.style_group_stats TO anon, authenticated;
GRANT SELECT ON public.regional_style_stats TO anon, authenticated;
GRANT SELECT ON public.body_silhouette_stats TO anon, authenticated;
GRANT SELECT ON public.tag_stats TO anon, authenticated;
