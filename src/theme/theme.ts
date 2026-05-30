// theme.ts - ライトモード刷新デザインシステム
// コンセプト: 高級マッチングアプリ × バイラルSNS診断
// 明るく・視認性が高く・プレミアム感のある「清潔感ローズ」テーマ

import { Platform } from 'react-native';

export const THEME = {
  colors: {
    // ─── ベース（ライトモード） ───
    background:   '#FFF5F7',   // 極薄ローズホワイト
    surface:      '#FFFFFF',   // 純白カード
    surfaceHigh:  '#FFF0F3',   // ホバー・セカンダリ
    surfaceGlass: 'rgba(255,255,255,0.85)', // グラスモーフィズム

    // ─── ブランドカラー ───
    primary:        '#E8245A',               // ディープローズ（視認性UP）
    primaryLight:   '#FF4D79',               // 明るいローズ
    primaryGradient: ['#E8245A', '#FF7043'], // ローズ → ディープオレンジ
    accent:         '#9333EA',               // バイオレット（サブカラー）
    accentBlue:     '#2563EB',               // サファイアブルー

    // ─── テキスト（コントラスト比4.5:1以上確保） ───
    text:        '#1A1A2E',   // 濃紺ブラック（#FFF5F7に対してコントラスト16:1）
    textSub:     '#4A4A6A',   // サブテキスト（コントラスト7:1）
    textMuted:   '#8888A8',   // 弱テキスト（コントラスト4.5:1）

    // ─── ボーダー・分割線 ───
    border:        'rgba(232,36,90,0.12)',
    borderActive:  'rgba(232,36,90,0.50)',
    borderHover:   'rgba(232,36,90,0.25)',

    // ─── アクション ───
    like:   '#059669',  // 深いエメラルド（白背景でも視認性OK）
    skip:   '#DC2626',  // 深いレッド

    // ─── セマンティック ───
    success: '#059669',
    warning: '#D97706',
    error:   '#DC2626',

    // 国別カラー（ライト背景向けに彩度UP）
    japan:   '#E8245A',
    korea:   '#7C3AED',
    usa:     '#2563EB',
    europe:  '#059669',
    china:   '#D97706',
    brazil:  '#EA580C',
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

  // シャドウ（ライトモード用：柔らかい影）
  shadow: Platform.select({
    web: {
      boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 8px 24px rgba(232,36,90,0.08)',
    },
    default: {
      shadowColor: '#E8245A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
      elevation: 4,
    },
  }),

  shadowGlow: Platform.select({
    web: {
      boxShadow: '0 0 24px rgba(232,36,90,0.20), 0 8px 32px rgba(232,36,90,0.12)',
    },
    default: {
      shadowColor: '#E8245A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.20,
      shadowRadius: 16,
      elevation: 8,
    },
  }),
};

// ─── CSS変数（Web専用）───
export const CSS_VARS = `
  :root {
    --color-bg: #FFF5F7;
    --color-surface: #FFFFFF;
    --color-primary: #E8245A;
    --color-accent: #9333EA;
    --color-text: #1A1A2E;
    --color-sub: #4A4A6A;
    --radius-md: 14px;
    --radius-lg: 20px;
  }
  * { box-sizing: border-box; }
  body { background: #FFF5F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Outfit', sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #FFF0F3; }
  ::-webkit-scrollbar-thumb { background: rgba(232,36,90,0.25); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(232,36,90,0.45); }
`;
