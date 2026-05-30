// resultService.test.ts - 診断結果サービスのテスト
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/lib/supabase';
import {
  saveDiagnosisResult,
  getDiagnosisHistory,
  deleteUserHistory,
} from '../../src/services/resultService';
import { ScoringResult } from '../../src/services/scoringService';

const makeMockScoringResult = (): ScoringResult => ({
  compatibility_score: 80,
  preference_type: 'ナチュラル派',
  preference_type_emoji: 'natural',
  mainstream_score: 80,
  uniqueness_score: 20,
  country_affinity: {
    top_country: 'japan',
    top_country_label: '日本',
    top_country_flag: '🇯🇵',
    top_country_score: 90,
    rankings: [
      {
        country: 'japan',
        label: '日本',
        flag: '🇯🇵',
        score: 90,
      },
    ],
  },
  body_preference: {
    bust_label: 'バランスの良い印象',
    butt_label: '自然なシルエット',
    height_label: 'average',
    silhouette_label: '整ったバランス',
    overall: '全体のバランスを重視',
  },
  age_preference: {
    top_age: 'early20s',
    label: '20代前半',
    description: '20代前半のフレッシュな魅力を好む傾向があります',
  },
  vibe_preference: {
    top_vibe: 'natural',
    label: 'ナチュラル系',
    score: 100,
  },
  rarity: {
    label: '大衆派',
    icon: 'users',
    description: 'みんなが好きなものを好む、共感力の高い好みです',
    score: 20,
  },
  meters: {
    gyaru_level: 0,
    pure_level: 80,
    global_level: 0,
    intellectual_level: 0,
    sexy_level: 0,
    mature_level: 0,
  },
  summary_json: {
    top_styles: ['natural'],
    top_regional_styles: ['日本寄りのナチュラル感'],
    top_tags: ['ナチュラル'],
    silhouette_impression: '全体のバランスを重視',
    focus_type: 'atmosphere',
    style_analysis: 'ナチュラル派です。',
    country_analysis: '日本の感性に近い傾向があります。',
    body_analysis: '全体のバランスを重視する傾向があります。',
    age_analysis: '20代前半のフレッシュな魅力を好む傾向があります。',
    rarity_analysis: '大衆派です。',
  },
});

// Supabase クライアントのモック
jest.mock('../../src/lib/supabase', () => {
  const mockFrom = jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(async () => ({
          data: {
            id: 'server-result-uuid-111',
            anonymous_user_id: 'user-123',
            session_id: 'sess-abc',
            compatibility_score: 80,
            preference_type: 'ナチュラル派',
            preference_type_emoji: 'natural',
            mainstream_score: 80,
            uniqueness_score: 20,
            summary_json: {},
            created_at: '2026-05-30T00:00:00.000Z',
          },
          error: null,
        })),
      })),
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(async () => ({
          data: [
            {
              id: 'server-result-uuid-222',
              anonymous_user_id: 'user-123',
              session_id: 'sess-xyz',
              compatibility_score: 70,
              preference_type: 'クール派',
              preference_type_emoji: 'cool',
              mainstream_score: 70,
              uniqueness_score: 30,
              summary_json: {},
              created_at: '2026-05-29T10:00:00.000Z',
            },
          ],
          error: null,
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(async () => ({ error: null })),
    })),
  }));

  return {
    supabase: {
      from: mockFrom,
    },
  };
});

// AsyncStorage の Jest モック設定
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn(async (key: string) => store[key] || null),
    setItem: jest.fn(async (key: string, value: string) => {
      store[key] = value;
      return null;
    }),
    removeItem: jest.fn(async (key: string) => {
      delete store[key];
      return null;
    }),
    clear: jest.fn(async () => {
      store = {};
      return null;
    }),
  };
});

describe('Result Service Sync tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('saveDiagnosisResult', () => {
    it('should save to Supabase and cache locally', async () => {
      const mockScoring = makeMockScoringResult();

      const result = await saveDiagnosisResult('user-123', 'sess-abc', mockScoring);

      expect(result).not.toBeNull();
      expect(result!.session_id).toBe('sess-abc');
      expect(supabase.from).toHaveBeenCalledWith('results');

      // AsyncStorage にもキャッシュされたことを確認
      const cachedRaw = await AsyncStorage.getItem('taste_compass_diagnosis_history');
      expect(cachedRaw).not.toBeNull();
      const cached = JSON.parse(cachedRaw!);
      expect(cached.length).toBe(1);
      expect(cached[0].session_id).toBe('sess-abc');
    });
  });

  describe('getDiagnosisHistory', () => {
    it('should fetch from local and server, merge, remove duplicates, sort, and writeback', async () => {
      // 1. ローカル履歴にセッション sess-abc (サーバー側のキャッシュ) と sess-local (オフライン時結果) を設定
      const localData = [
        {
          id: 'local-id-1',
          anonymous_user_id: 'user-123',
          session_id: 'sess-abc',
          compatibility_score: 80,
          preference_type: 'ナチュラル派',
          created_at: '2026-05-30T00:00:00.000Z',
        },
        {
          id: 'local-id-2',
          anonymous_user_id: 'user-123',
          session_id: 'sess-local',
          compatibility_score: 90,
          preference_type: 'フェミニン派',
          created_at: '2026-05-28T00:00:00.000Z',
        },
      ];
      await AsyncStorage.setItem('taste_compass_diagnosis_history', JSON.stringify(localData));

      // 2. マージ取得を実行。モックされたサーバーからは sess-xyz (created_at: 2026-05-29) が返ってくる。
      const history = await getDiagnosisHistory('user-123');

      // マージ結果として sess-abc (5/30), sess-xyz (5/29), sess-local (5/28) の3つが得られるべき。
      expect(history.length).toBe(3);
      expect(history[0].session_id).toBe('sess-abc'); // 最新順
      expect(history[1].session_id).toBe('sess-xyz');
      expect(history[2].session_id).toBe('sess-local');

      // 最新状態が AsyncStorage にキャッシュ更新されているか
      const currentCache = JSON.parse(
        (await AsyncStorage.getItem('taste_compass_diagnosis_history'))!,
      );
      expect(currentCache.length).toBe(3);
    });
  });

  describe('deleteUserHistory', () => {
    it('should purge AsyncStorage and delete from Supabase tables', async () => {
      await saveDiagnosisResult('user-123', 'sess-abc', makeMockScoringResult());

      const success = await deleteUserHistory('user-123');
      expect(success).toBe(true);

      const cached = await AsyncStorage.getItem('taste_compass_diagnosis_history');
      expect(cached).toBeNull();

      expect(supabase.from).toHaveBeenCalledWith('results');
      expect(supabase.from).toHaveBeenCalledWith('diagnosis_sessions');
      expect(supabase.from).toHaveBeenCalledWith('votes');
    });
  });
});
