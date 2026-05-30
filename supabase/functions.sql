-- functions.sql - 統計取得用などの RPC 定義

-- 1. 全体の統計サマリーを一度に取得するRPC
CREATE OR REPLACE FUNCTION public.get_overall_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  style_stats jsonb;
  regional_stats jsonb;
  popular_tags jsonb;
  result jsonb;
BEGIN
  -- style_groupごとの統計
  SELECT jsonb_agg(jsonb_build_object(
    'style_group', style_group,
    'avg_like_rate', ROUND(avg_like_rate::numeric, 1),
    'total_votes', total_votes
  )) INTO style_stats
  FROM public.style_group_stats
  WHERE total_votes > 0;

  -- regional_styleごとの統計
  SELECT jsonb_agg(jsonb_build_object(
    'regional_style', regional_style,
    'avg_like_rate', ROUND(avg_like_rate::numeric, 1),
    'total_votes', total_votes
  )) INTO regional_stats
  FROM public.regional_style_stats
  WHERE total_votes > 0;

  -- 人気のタグ上位10件
  SELECT jsonb_agg(jsonb_build_object(
    'tag', tag,
    'avg_like_rate', ROUND(avg_like_rate::numeric, 1),
    'total_votes', total_votes
  )) INTO popular_tags
  FROM (
    SELECT tag, avg_like_rate, total_votes
    FROM public.tag_stats
    WHERE total_votes > 0
    ORDER BY avg_like_rate DESC
    LIMIT 10
  ) as top_tags;

  -- 結果の組み立て
  result := jsonb_build_object(
    'style_groups', COALESCE(style_stats, '[]'::jsonb),
    'regional_styles', COALESCE(regional_stats, '[]'::jsonb),
    'popular_tags', COALESCE(popular_tags, '[]'::jsonb)
  );

  RETURN result;
END;
$$;

-- 2. 画像の国別投票を加算(UPSERT)するRPC
CREATE OR REPLACE FUNCTION public.increment_image_vote(
  p_image_id uuid,
  p_country_code text,
  p_vote_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_vote_type = 'like' THEN
    INSERT INTO public.image_country_stats (image_id, country_code, like_count, skip_count)
    VALUES (p_image_id, p_country_code, 1, 0)
    ON CONFLICT (image_id, country_code)
    DO UPDATE SET like_count = public.image_country_stats.like_count + 1;
  ELSIF p_vote_type = 'skip' THEN
    INSERT INTO public.image_country_stats (image_id, country_code, like_count, skip_count)
    VALUES (p_image_id, p_country_code, 0, 1)
    ON CONFLICT (image_id, country_code)
    DO UPDATE SET skip_count = public.image_country_stats.skip_count + 1;
  END IF;
END;
$$;

-- RPCの実行権限をanon/authenticatedに付与
GRANT EXECUTE ON FUNCTION public.get_overall_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_image_vote(uuid, text, text) TO anon, authenticated;
