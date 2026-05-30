// supabase.ts - Supabase クライアントの初期化
import 'react-native-url-polyfill/auto'; // ネイティブ環境でのURLポリフィル
import { createClient } from '@supabase/supabase-js';
import { ENV } from './env';

// Supabaseクライアントの初期化
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // ログイン不要、匿名IDベースの運用のためにセッション永続化はOFFにする
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
