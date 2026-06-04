// theme.ts - ライトモード刷新デザインシステム
// コンセプト: 高級マッチングアプリ × バイラルSNS診断
// 明るく・視認性が高く・プレミアム感のある「清潔感ローズ」テーマ

import { Platform } from 'react-native';

export const THEME = {
  colors: {
    // ─── ベース（ライトモード） ───
    background:   '#FAF7F5',   // 温かみのあるウォームベージュ（生成り色）
    surface:      '#FFFFFF',   // 純白カード
    surfaceHigh:  '#F2EDE9',   // 少し濃いベージュ（ホバー・セカンダリ）
    surfaceGlass: 'rgba(255,255,255,0.85)', // グラスモーフィズム

    // ─── ブランドカラー ───
    primary:        '#AF5239',               // ディープテラコッタ（落ち着いた煉瓦色）
    primaryLight:   '#C96E54',               // 明るいテラコッタ
    primaryGradient: ['#AF5239', '#AF5239'], // グラデーション廃止（同色ソリッド）
    accent:         '#4F6B58',               // セージグリーン（落ち着いたアースグリーン）
    accentBlue:     '#2E4C6D',               // スレートブルー

    // ─── テキスト（コントラスト比4.5:1以上確保） ───
    text:        '#2B2523',   // 温かみのあるチャコールブラウン（炭黒）
    textSub:     '#5C524F',   // サブテキスト
    textMuted:   '#9E928E',   // 弱テキスト

    // ─── ボーダー・分割線 ───
    border:        'rgba(175,82,57,0.12)',
    borderActive:  'rgba(175,82,57,0.50)',
    borderHover:   'rgba(175,82,57,0.25)',

    // ─── アクション ───
    like:   '#3E7B5E',  // 落ち着いたエメラルドグリーン
    skip:   '#C24B4B',  // 落ち着いたアンティークレッド

    // ─── セマンティック ───
    success: '#3E7B5E',
    warning: '#D97706',
    error:   '#C24B4B',

    // 国別カラー（落ち着いたトーン）
    japan:   '#AF5239',
    korea:   '#6B5B95',
    usa:     '#2E4C6D',
    europe:  '#4F6B58',
    china:   '#D97706',
    brazil:  '#E07A5F',
  },

  fonts: {
    regular: 'System',
    bold:    'System',
  },

  radius: {
    xs:  6,
    sm:  10,
    md:  14,
    lg:  20,
    xl:  28,
    full: 9999,
  },

  // シャドウ（ライトモード用：柔らかいアースカラーの影）
  shadow: Platform.select({
    web: {
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 8px 24px rgba(175,82,57,0.06)',
    },
    default: {
      shadowColor: '#AF5239',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
  }),

  shadowGlow: Platform.select({
    web: {
      boxShadow: '0 0 24px rgba(175,82,57,0.12), 0 8px 32px rgba(175,82,57,0.08)',
    },
    default: {
      shadowColor: '#AF5239',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  }),
};

// ─── CSS変数（Web専用）───
export const CSS_VARS = `
  :root {
    --color-bg: #FAF7F5;
    --color-surface: #FFFFFF;
    --color-primary: #AF5239;
    --color-accent: #4F6B58;
    --color-text: #2B2523;
    --color-sub: #5C524F;
    --radius-md: 14px;
    --radius-lg: 20px;
  }
  * { box-sizing: border-box; }
  body { background: #FAF7F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Outfit', sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #F2EDE9; }
  ::-webkit-scrollbar-thumb { background: rgba(175,82,57,0.25); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(175,82,57,0.45); }
`;
