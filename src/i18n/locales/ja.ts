// src/i18n/locales/ja.ts - 日本語（主言語）
export const ja = {
  // ── メタ ──────────────────────────────────────────
  lang: { name: '日本語', flag: '🇯🇵' },

  // ── 共通 ──────────────────────────────────────────
  common: {
    loading: '読み込み中...',
    analyzing: '分析中...',
    error: 'エラーが発生しました',
    retry: 'もう一度試す',
    close: '閉じる',
    back: '戻る',
    next: '次へ',
    confirm: '確認',
    cancel: 'キャンセル',
    home: 'ホーム',
    settings: '設定',
    history: '履歴',
    stats: '統計',
    share: 'シェア',
    notFound: '見つかりませんでした',
    resultNotFound: '診断結果が見つかりませんでした',
    backHome: '← ホームに戻る',
  },

  // ── ホーム画面 ────────────────────────────────────
  home: {
    badge: '✦ AI ビジュアル診断',
    title: 'あなたの好みは\n',
    titleAccent: '世間とズレてる？',
    subtitle: 'スワイプするだけで好みを多角的に分析。\n世界7ヵ国との好み比較、体型・年齢傾向まで。',
    startBtn: '診断スタート',
    feature1Label: 'スワイプで診断',
    feature1Desc: '左右にスワイプするだけ',
    feature2Label: '多角的な分析',
    feature2Desc: '7ヵ国比較・体型・年齢傾向',
    feature3Label: '世間との比較',
    feature3Desc: '蓄積データで精度が上がる',
    disclaimer:
      '登場する人物はすべてAI生成の架空の成人女性（20歳以上）です。実在の人物とは一切関係ありません。娯楽・好み分析目的のサービスです。',
    navHistory: '履歴',
    navStats: '統計',
    navSettings: '設定',
    terms: '利用規約',
    privacy: 'プライバシー',
    contact: 'お問い合わせ',
    copyright: '© 2025 Taste Compass',
  },

  // ── セットアップ画面 ───────────────────────────────
  setup: {
    stepLabel: 'STEP 1 OF 2',
    pageTitle: '診断の設定',
    pageSub: '枚数とテーマを選んでスタート',
    countSection: '診断枚数',
    themeSection: 'テーマ',
    recommended: '推奨',
    approx5min: '約5分',
    approx8min: '約8分',
    approx15min: '約15分',
    startBtn: '{{count}}枚 · {{theme}} で診断スタート',
    themes: {
      all:     { label: '全ジャンル',   emoji: '✦', desc: 'あらゆるスタイルから幅広く診断' },
      natural: { label: 'ナチュラル系', emoji: '🌸', desc: '清楚・ナチュラル・清潔感系' },
      cool:    { label: 'クール系',     emoji: '🖤', desc: '都会的・モード・知的系' },
      cute:    { label: '可愛い系',     emoji: '🎀', desc: 'アイドル・フェミニン・ガーリー系' },
      sexy:    { label: 'セクシー系',   emoji: '🔥', desc: 'グラマー・ギャル・色気重視系' },
      korean:  { label: '韓国風',       emoji: '✨', desc: 'K-beauty・トレンド系' },
      global:  { label: 'グローバル系', emoji: '🌍', desc: '多国籍・洋風・ダイバーシティ系' },
      mature:  { label: '大人っぽい系', emoji: '💎', desc: '知的・エレガント・成熟系' },
      casual:  { label: 'カジュアル系', emoji: '😊', desc: 'スポーティ・カジュアル・親しみ系' },
    },
  },

  // ── 診断画面 ──────────────────────────────────────
  diagnosis: {
    loading: '画像を読み込み中...',
    progress: '{{current}} / {{total}}',
    likeHint: '好き',
    skipHint: 'スキップ',
    complete: '診断完了！',
    calculating: '結果を計算中...',
    swipeHint: 'スワイプして判定',
  },

  // ── 結果画面 ──────────────────────────────────────
  result: {
    loading: '結果を分析中...',
    yourType: 'あなたの好みタイプ',
    compatibilityLabel: '世間との一致度',
    mainstream: '王道派',
    unique: '個性派',
    countryRanking: '🌍 好みが近い国ランキング',
    countryAffinity: 'あなたの好みは',
    countrySuffix: '系',
    countryMatch: '一致度 {{score}}%',
    meterSection: '📊 好みの傾向メーター',
    detailSection: '💡 詳細傾向',
    ageLabel: '好みの年齢感',
    vibeLabel: '雰囲気タイプ',
    tagSection: '🏷 反応したタグ',
    shareX: '𝕏 でシェアする',
    retryBtn: 'もう一度診断する',
    shareText:
      '【好みズレ診断】{{emoji}} {{type}}\n世間との一致度: {{score}}%\n好みが近い国: {{flag}}{{country}}\nレア度: {{rarity}}\n\n{{analysis}}\n\n#好みズレ診断 #TasteCompass',
    meters: {
      gyaru:        'ギャル度',
      pure:         '清楚度',
      sexy:         'セクシー度',
      mature:       '大人度',
      intellectual: '知的度',
      global:       'グローバル',
    },
  },

  // ── ナビゲーション ────────────────────────────────
  nav: {
    home:     'ホーム',
    history:  '履歴',
    stats:    '統計',
    settings: '設定',
  },

  // ── 設定画面 ──────────────────────────────────────
  settings: {
    title: '設定',
    language: '言語',
    languageDesc: 'アプリの表示言語',
    deleteData: 'データ削除',
    deleteDataDesc: '診断履歴をすべて削除する',
    version: 'バージョン',
  },
};

export type TranslationKeys = typeof ja;
