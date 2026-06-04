// scoringService.test.ts - スコアリングロジックのテスト
import {
  calculateDiagnosisResult,
  translateInternalTag,
  ImageMetadata,
  VoteData,
} from '../../src/services/scoringService';

jest.mock('../../src/i18n', () => ({
  getCurrentLang: jest.fn(() => 'ja'),
}));

describe('Scoring Service tests', () => {
  // テスト用モック画像データ
  const mockImages: ImageMetadata[] = [
    {
      id: 'img1',
      image_url: 'https://example.com/img1.jpg',
      style_group: 'natural',
      regional_style: 'japanese_style',
      body_silhouette: 'balanced',
      bust_impression: 'average',
      butt_impression: 'average',
      height_impression: 'average',
      age_impression: 'early20s',
      vibe_type: 'pure',
      hair_style: 'long_straight',
      skin_tone: 'fair',
      makeup_level: 'natural',
      tags: ['ナチュラル', '黒髪'],
      popularity_score: 60,
      like_rate: 60,
    },
    {
      id: 'img2',
      image_url: 'https://example.com/img2.jpg',
      style_group: 'cool',
      regional_style: 'western_style',
      body_silhouette: 'curvy',
      bust_impression: 'full',
      butt_impression: 'full',
      height_impression: 'tall',
      age_impression: 'mid20s',
      vibe_type: 'cool',
      hair_style: 'medium',
      skin_tone: 'medium',
      makeup_level: 'moderate',
      tags: ['クール', '都会的'],
      popularity_score: 40,
      like_rate: 40,
    },
    {
      id: 'img3',
      image_url: 'https://example.com/img3.jpg',
      style_group: 'natural',
      regional_style: 'japanese_style',
      body_silhouette: 'slim',
      bust_impression: 'subtle',
      butt_impression: 'average',
      height_impression: 'average',
      age_impression: 'teens',
      vibe_type: 'pure',
      hair_style: 'long_straight',
      skin_tone: 'fair',
      makeup_level: 'natural',
      tags: ['ナチュラル', '笑顔', '清楚'],
      popularity_score: 80,
      like_rate: 80,
    },
  ];

  describe('translateInternalTag', () => {
    it('should translate bust impression full/subtle to polite Japanese expressions', () => {
      expect(translateInternalTag('bust_impression', 'full')).toBe('柔らかいシルエット');
      expect(translateInternalTag('bust_impression', 'subtle')).toBe('すっきりした印象');
    });

    it('should translate body silhouette curvy to elegant Japanese expressions', () => {
      expect(translateInternalTag('body_silhouette', 'curvy')).toBe('大人っぽいシルエット');
    });

    it('should translate regional styles correctly', () => {
      expect(translateInternalTag('regional_style', 'western_style')).toBe('グローバル系の洗練感');
      expect(translateInternalTag('regional_style', 'korean_style')).toBe('韓国風トレンド感');
      expect(translateInternalTag('regional_style', 'japanese_style')).toBe(
        '日本寄りのナチュラル感',
      );
    });
  });

  describe('calculateDiagnosisResult', () => {
    it('should calculate compatibility score and identify preference type', () => {
      const votes: VoteData[] = [
        { image_id: 'img1', vote_type: 'like' },
        { image_id: 'img2', vote_type: 'skip' }, // skip rate = 100 - 40 = 60
        { image_id: 'img3', vote_type: 'like' },
      ];

      const result = calculateDiagnosisResult(votes, mockImages);

      // (60 + 60 + 80) / 3 = 66.6 -> 67
      expect(result.compatibility_score).toBe(67);
      expect(result.mainstream_score).toBe(67);
      expect(result.uniqueness_score).toBe(33);
      expect(result.preference_type).toBe('ナチュラル・清楚派'); // naturalが多くlikeされたため
    });

    it('should fall back to popularity_score if like_rate is undefined', () => {
      const imagesWithoutLikeRate: ImageMetadata[] = [
        {
          id: 'img1',
          image_url: 'https://example.com/img1.jpg',
          style_group: 'natural',
          regional_style: 'japanese_style',
          body_silhouette: 'balanced',
          bust_impression: 'average',
          butt_impression: 'average',
          height_impression: 'average',
          age_impression: 'early20s',
          vibe_type: 'pure',
          hair_style: 'medium',
          skin_tone: 'fair',
          makeup_level: 'natural',
          tags: ['ナチュラル'],
          popularity_score: 55,
        },
      ];
      const votes: VoteData[] = [{ image_id: 'img1', vote_type: 'like' }];

      const result = calculateDiagnosisResult(votes, imagesWithoutLikeRate);
      expect(result.compatibility_score).toBe(55);
    });

    it('should calculate focus type and compile style analyses', () => {
      const votes: VoteData[] = [
        { image_id: 'img1', vote_type: 'like' },
        { image_id: 'img3', vote_type: 'like' },
      ];

      const result = calculateDiagnosisResult(votes, mockImages);

      expect(result.summary_json.top_styles).toContain('natural');
      expect(result.summary_json.top_tags).toContain('ナチュラル');
      expect(result.summary_json.focus_type).toBe('face'); // 「黒髪」「笑顔」などの顔指標タグによる判定
    });

    it('should calculate score correctly when all votes are "like"', () => {
      const votes: VoteData[] = [
        { image_id: 'img1', vote_type: 'like' },
        { image_id: 'img2', vote_type: 'like' },
        { image_id: 'img3', vote_type: 'like' },
      ];
      // (60 + 40 + 80) / 3 = 60
      const result = calculateDiagnosisResult(votes, mockImages);
      expect(result.compatibility_score).toBe(60);
    });

    it('should calculate score correctly when all votes are "skip"', () => {
      const votes: VoteData[] = [
        { image_id: 'img1', vote_type: 'skip' }, // 100 - 60 = 40
        { image_id: 'img2', vote_type: 'skip' }, // 100 - 40 = 60
        { image_id: 'img3', vote_type: 'skip' }, // 100 - 80 = 20
      ];
      // (40 + 60 + 20) / 3 = 40
      const result = calculateDiagnosisResult(votes, mockImages);
      expect(result.compatibility_score).toBe(40);
    });

    it('should handle empty votes and return default score 50', () => {
      const votes: VoteData[] = [];
      const result = calculateDiagnosisResult(votes, mockImages);
      expect(result.compatibility_score).toBe(50);
    });

    it('should prioritize real imageStats data over default scores', () => {
      const votes: VoteData[] = [
        { image_id: 'img1', vote_type: 'like' },
        { image_id: 'img2', vote_type: 'like' },
      ];
      // img1のみ実データ（likes=20, skips=10, total=30, like_rate=67%）があり、img2は実データがない（total=0）場合をシミュレート
      const mockImageStats = {
        img1: {
          likes: 20,
          skips: 10,
          total: 30,
          like_rate: 67,
          last_updated: '2026-06-04T00:00:00.000Z',
        },
        img2: { likes: 0, skips: 0, total: 0, like_rate: 50, last_updated: '' },
      };

      const result = calculateDiagnosisResult(votes, mockImages, mockImageStats);

      // img1は実データがあり、img2は実データ（total=0）がないため、img1のみが集計対象（フォールバックが排除される）
      // よって一致度は67%になる
      expect(result.compatibility_score).toBe(67);
    });
  });
});
