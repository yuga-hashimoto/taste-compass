// src/i18n/locales/ja.ts - 日本語（主言語）
export const ja = {
  // ── メタ ──────────────────────────────────────────
  lang: { name: '日本語', flag: 'ja' },

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
    subtitle: 'スワイプするだけで好みを多角的に分析。\n世界各国との好み比較、体型・年齢傾向まで。',
    startBtn: '診断スタート',
    feature1Label: 'スワイプで診断',
    feature1Desc: '左右にスワイプするだけ',
    feature2Label: '多角的な分析',
    feature2Desc: '世界比較・体型・年齢傾向',
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
    pageSub: '枚数を選んでスタート',
    countSection: '診断枚数',
    themeSection: 'テーマ',
    recommended: '推奨',
    approx5min: '約5分',
    approx8min: '約8分',
    approx15min: '約15分',
    startBtn: '診断スタート',
    themes: {
      all: { label: '全ジャンル', desc: 'あらゆるスタイルから幅広く診断' },
      natural: { label: 'ナチュラル系', desc: '清楚・ナチュラル・清潔感系' },
      cool: { label: 'クール系', desc: '都会的・モード・知的系' },
      cute: { label: '可愛い系', desc: 'アイドル・フェミニン・ガーリー系' },
      sexy: { label: 'セクシー系', desc: 'グラマー・ギャル・色気重視系' },
      korean: { label: '韓国風', desc: 'K-beauty・トレンド系' },
      global: { label: 'グローバル系', desc: '多国籍・洋風・ダイバーシティ系' },
      mature: { label: '大人っぽい系', desc: '知的・エレガント・成熟系' },
      casual: { label: 'カジュアル系', desc: 'スポーティ・カジュアル・親しみ系' },
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
    title: '診断結果',
    loading: '結果を分析中...',
    yourType: 'あなたの好みタイプ',
    compatibilityLabel: '世間との一致度',
    mainstream: '王道派',
    unique: '個性派',
    countryRanking: '好みが近い国ランキング',
    countryAffinity: 'あなたの好みは',
    countrySuffix: '系',
    countryMatch: '一致度 {{score}}%',
    meterSection: '好みの傾向メーター',
    detailSection: '💡 詳細傾向',
    ageLabel: '好みの年齢感',
    vibeLabel: '雰囲気タイプ',
    tagSection: '🏷 反応したタグ',
    shareX: '𝕏 でシェアする',
    retryBtn: 'もう一度診断する',
    shareText:
      '【好みズレ診断】{{type}}\n世間との一致度: {{score}}%\n好みが近い国: {{country}}\nレア度: {{rarity}}\n\n{{analysis}}\n\n#好みズレ診断 #TasteCompass',
    meters: {
      gyaru: 'ギャル度',
      pure: '清楚度',
      sexy: 'セクシー度',
      mature: '大人度',
      intellectual: '知的度',
      global: 'グローバル',
    },
  },

  // ── ナビゲーション ────────────────────────────────
  nav: {
    home: 'ホーム',
    diagnosis: '診断',
    history: '履歴',
    stats: '統計',
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
    anonymousInfo: '匿名ユーザー情報',
    yourAnonymousId: 'あなたの匿名ID',
    anonymousIdLoading: '読み込み中...',
    anonymousSub: '※個人情報は一切紐づいていません。端末ローカルに安全に暗号・保存されています。',
    aboutService: 'サービスについて',
    aboutImagesTitle: '診断画像について',
    aboutImagesText:
      '本サービスで用いられるビジュアルは、すべてAIにより生成された架空の成人女性であり、実在のモデルや人物は存在しません。未成年に見える画像の排除、および過度な露出や身体の強調などのセンシティブ表現の防止を徹底しています。',
    adsPrivacyTitle: '広告とプライバシー',
    adsPrivacyText:
      '本サービスは広告配信を通じて低コストで持続的に運営されています。診断中には誤操作を防止するため一切広告を表示しません。また、個人を特定できるトラッキングは行っていません。',
    docsContact: 'ドキュメント & お問い合わせ',
    termsOfService: '利用規約',
    privacyPolicy: 'プライバシーポリシー',
    reportLink: '不適切画像の報告 / お問い合わせ',
    dataDeleteSection: 'データ削除・再生成',
    regenerateId: '匿名IDの再生成',
    regenerateIdDesc: '診断履歴を引き継がず、完全に新規IDを発行します。',
    deleteAllData: '履歴とデータの完全削除',
    deleteAllDataDesc:
      'このデバイスに保存されている履歴と、データベース上の全投票データを永久に削除します。',
    regenerateModalTitle: '匿名IDを再生成しますか？',
    regenerateModalDesc:
      '新しいIDに切り替わると、これまでの履歴データが読み込めなくなります。この操作は取り消せません。',
    regenerateConfirm: '再生成する',
    deleteModalTitle: 'データを完全削除しますか？',
    deleteModalDesc:
      'このデバイスおよびクラウドデータベースに保存されているすべての履歴、セッション、投票データが完全に消去されます。',
    deleteConfirm: '完全に削除',
  },

  // ── 履歴画面 ──────────────────────────────────────
  history: {
    title: '診断履歴',
    loading: '履歴を読み込み中...',
    emptyTitle: '診断履歴がありません',
    emptySub: '診断を行うと、ここに好みの履歴が保存されます',
    startButton: '診断を始める',
    detailLink: '詳細を見る →',
    matchBadge: '{{score}}% 一致',
  },

  // ── 統計画面 ──────────────────────────────────────
  stats: {
    everyoneTitle: 'みんなの統計',
    mySummaryTitle: 'あなたの分析サマリー',
    rankingTitle: '好みの「好き」比率ランキング (Top 10)',
    rankingLoading: 'ランキング収集中...',
    emptyData: 'データが十分に集まっていません',
    emptyDataSub: '診断を増やすことで統計が算出されます',
    votesCount: '{{count}} 票',
    countries: {
      all: '🌏 全体',
      ja: '🇯🇵 日本',
      ko: '🇰🇷 韓国',
      en: '🇺🇸 英語圏',
      zhCN: '🇨🇳 中国',
      zhTW: '🇹🇼 台湾',
      es: '🇪🇸 スペイン語圏',
      pt: '🇵🇹 ポルトガル語圏',
      fr: '🇫🇷 フランス',
      de: '🇩🇪 ドイツ',
      id: '🇮🇩 インドネシア',
      th: '🇹🇭 タイ',
      vi: '🇻🇳 ベトナム',
      ar: '🇸🇦 アラブ圏',
      hi: '🇮🇳 インド',
    },

    title: '統計データ',
    loading: '統計データを集計中...',
    compareTitle: 'あなたの好み傾向（平均）',
    compareStatsBtn: '診断して統計を比較する',
    mostType: '最多タイプ',
    averageCompatibility: '平均世間一致度',
    notDiagnosed: '未診断',
    notMeasured: '未計測',
    overallStyleTitle: '全体人気スタイルグループ (Like率順)',
    overallTasteTitle: '全体人気ビジュアルテイスト (Like率順)',
    popularTagsTitle: '注目タグランキング',
    styles: {
      natural: 'ナチュラル',
      clean: '清楚クリーン',
      cool: 'クール都会派',
      mode: '個性派モード',
      casual: 'カジュアル',
      feminine: '柔らかフェミニン',
      korean: '韓国トレンド',
      office: 'オフィス上品',
      mature: '大人っぽい',
      simple: 'シンプルミニマル',
      travel: 'トラベル雰囲気',
      cafe: 'カフェリラックス',
    },
  },

  // ── お問い合わせ画面 ────────────────────────────────
  contact: {
    title: '不適切報告 / お問い合わせ',
    subtitle:
      '本サービスの画像に関して、実在人物への酷似や不適切な表現がある場合はこちらからご報告ください。',
    labelType: 'お問い合わせの種類',
    labelImageId: '対象の画像ID (分かる場合のみ・任意)',
    labelMessage: 'メッセージ内容 (必須)',
    placeholderImageId: '例: 00000000-0000-0000-0000-000000000001',
    placeholderMessage: '具体的な不適切箇所や、削除を要請する理由を詳しくご記入ください。',
    errorRequired: 'メッセージ本文を入力してください。',
    errorSubmit: '送信に失敗しました。時間をおいて再度お試しください。',
    successTitle: '送信が完了しました',
    successDesc:
      'ご報告・お問い合わせありがとうございました。頂いた内容を運営で確認し、必要に応じて迅速に対応（画像の削除や非表示措置等）を行います。',
    submitting: '送信中...',
    submit: '送信する',
    types: {
      inappropriate: '不適切な画像の報告',
      inappropriateDesc: '露出度が高い、または健全ではないビジュアルが含まれる場合',
      resemblance: '実在人物への酷似報告',
      resemblanceDesc: '実在の特定個人や有名人に酷似しており、削除・差替を求める場合',
      other: 'その他のお問い合わせ',
      otherDesc: 'ご意見、バグ報告、その他の運営へのお問い合わせ',
    },
  },

  // ── 利用規約 & プライバシーポリシー ────────────────
  documents: {
    termsTitle: '利用規約',
    privacyTitle: 'プライバシーポリシー',
    termsContent: `第1条 (適用)
本利用規約は、「好みズレ診断（Taste Compass）」（以下、「本サービス」）の提供条件および本サービスと利用者との間の権利義務関係を定めるものです。利用者は、本サービスを利用することにより、本規約に同意したものとみなされます。

第2条 (サービスの本質と免責)
1. 本サービスで表示される人物画像は、すべて人工知能(AI)技術によって自動生成された「架空の成人女性」のビジュアルであり、実在する人物、モデル、または有名人とは一切関係ありません。
2. 本サービスは、利用者の好みの傾向を統計的に分析・診断する娯楽目的のツールであり、特定の人物의 美醜の判定や、優劣を決定づけるものではありません。結果の正確性や客観性について一切保証しません。

第3条 (利用対象年齢)
本サービスで取り扱うコンテンツは成人向け表現を排除した健全な日常ファッションですが、サービスの性質上、18歳未満の利用は想定していません。18歳未満の方が利用する場合は、保護者・親権者の同意を得る必要があります。

第4条 (禁止事項)
利用者は本サービスの利用にあたり、以下の行為を行ってはなりません。
• 診断結果や画像を、実在する特定の個人を誹謗中傷、差別、名誉毀損する目的で利用・共有する行為。
• 本サービスに対して不正アクセスを行い、またはサーバーに過度な負荷をかける行為。
• その他、公序良俗に反する行為または運営が不適切と判断した行為。

第5条 (不適切画像への対応)
万一、本サービス内の画像において実在の人物に極めて酷似している、または不適切であると思われる画像を発見した場合は、アプリ内「お問い合わせ/報告」ページよりご報告ください。運営側で確認し、必要に応じて画像の非アクティブ化、削除等の措置を速やかに行います。

第6条 (規約の変更)
運営は、必要と判断した場合にはいつでも本規約を変更することができるものとします。変更後の利用規約は、本サービス上に掲載された時点から効力を生じるものとします。`,
    privacyContent: `1. 取得する情報について
本サービスは、ユーザー登録やログインを必要としない「完全匿名」でご利用いただけます。取得するデータは以下の通り最小限に制限されています。
• 匿名ID: クライアント端末側で自動生成されるランダムなUUIDであり、個人の氏名、メールアドレス、電話番号などの個人情報は一切紐づきません。
• 投票ログ: 診断中に入力した「好き」「スキップ」の選択データ。画像ごとのLike率集計に利用されます。
• 診断結果: 世間との一致度、お好みのタイプ傾向などの計算結果。
• デバイス情報: ご利用のプラットフォーム (iOS/Android/Web) 情報。

2. 情報の利用目的
取得した匿名情報は、以下の目的でのみ利用されます。
• 利用者に対するパーソナライズされた好み診断結果の提供。
• 画像ごとの全体Like率や、人気スタイルの統計情報の集計・作成。
• サービスの動作不具合検出、およびUI/UXの改善。

3. 広告配信とデータ利用について
本サービスでは、第三者配信事業者（Google AdMob、Google AdSense等）による広告配信を行っています。これらは、ユーザーの興味に応じた広告を表示するために、Cookieや広告識別子（IDFA/AAID等）の匿名識別技術を利用する場合があります。これらはブラウザの設定や端末のプライバシー設定によりオプトアウト（無効化）することが可能です。

4. データの削除と自己管理について
利用者は、アプリ内の「設定」画面より、ご自身の全診断履歴およびデータベースに同期されているすべての匿名投票ログをいつでも瞬時に完全削除することができます。また、匿名IDの再生成を行うことで、クラウド上のデータとの関連性を完全に遮断することができます。

5. お問い合わせ
プライバシーおよびデータ取り扱いに関するご質問、削除依頼等は、アプリ内「お問い合わせ / 報告」フォームよりお送りください。`,
  },
};

export type TranslationKeys = typeof ja;
