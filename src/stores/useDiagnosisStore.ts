// useDiagnosisStore.ts - 診断用状態管理ストア
import { create } from 'zustand';
import { getOrCreateAnonymousUserId, regenerateAnonymousUserId } from '../lib/anonymousUser';

interface DiagnosisSessionState {
  anonymousUserId: string | null;
  currentSessionId: string | null;
  currentTheme: string;
  totalImagesCount: number;
  completedCount: number;
  isInitialized: boolean;
  historyList: any[]; // 過去の診断結果

  // アクション
  initializeStore: () => Promise<void>;
  startSession: (theme: string, count: number) => string;
  updateProgress: (count: number) => void;
  endSession: () => void;
  resetAnonymousUser: () => Promise<void>;
  setHistoryList: (history: any[]) => void;
  addHistoryItem: (item: any) => void;
}

export const useDiagnosisStore = create<DiagnosisSessionState>((set, get) => ({
  anonymousUserId: null,
  currentSessionId: null,
  currentTheme: 'all',
  totalImagesCount: 30,
  completedCount: 0,
  isInitialized: false,
  historyList: [],

  initializeStore: async () => {
    if (get().isInitialized) return;
    const userId = await getOrCreateAnonymousUserId();
    set({ anonymousUserId: userId, isInitialized: true });
  },

  startSession: (theme, count) => {
    // クライアント側でセッションIDを作成 (UUID)
    const sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
    set({
      currentSessionId: sessionId,
      currentTheme: theme,
      totalImagesCount: count,
      completedCount: 0,
    });
    return sessionId;
  },

  updateProgress: (count) => {
    set({ completedCount: count });
  },

  endSession: () => {
    set({ currentSessionId: null, completedCount: 0 });
  },

  resetAnonymousUser: async () => {
    const newId = await regenerateAnonymousUserId();
    set({ anonymousUserId: newId, historyList: [], currentSessionId: null, completedCount: 0 });
  },

  setHistoryList: (history) => {
    set({ historyList: history });
  },

  addHistoryItem: (item) => {
    set((state) => ({
      historyList: [item, ...state.historyList],
    }));
  },
}));
