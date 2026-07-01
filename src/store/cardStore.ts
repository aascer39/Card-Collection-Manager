import { create } from 'zustand';
import type { Card, ViewMode } from '../types/card';
import * as api from '../services/api';

interface CardState {
  cards: Card[];
  viewMode: ViewMode;
  selectedIds: Set<number>;
  searchKeyword: string;
  isLoading: boolean;
  error: string | null;

  fetchCards: () => Promise<void>;
  searchCards: (keyword: string) => Promise<void>;
  toggleCollect: (cardId: number) => Promise<void>;
  toggleSelect: (cardId: number) => void;
  selectAll: () => void;
  invertSelection: () => void;
  clearSelection: () => void;
  batchMarkCollected: () => Promise<void>;
  batchMarkUncollected: () => Promise<void>;
  resetCollection: () => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setSearchKeyword: (keyword: string) => void;
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  viewMode: 'suit',
  selectedIds: new Set<number>(),
  searchKeyword: '',
  isLoading: false,
  error: null,

  fetchCards: async () => {
    set({ isLoading: true, error: null });
    try {
      const cards = await api.getCards();
      set({ cards, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  searchCards: async (keyword: string) => {
    // Don't show loading during search — causes flicker
    try {
      const cards = keyword.trim()
        ? await api.searchCards(keyword.trim())
        : await api.getCards();
      set({ cards, error: null });
    } catch (e) {
      // Silently ignore search errors, keep current cards
      console.error('Search error:', e);
    }
  },

  toggleCollect: async (cardId: number) => {
    // Optimistic update: flip immediately
    const prevCards = get().cards;
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, collected: !c.collected } : c
      ),
    }));
    try {
      const updated = await api.toggleCollect(cardId);
      set((state) => ({
        cards: state.cards.map((c) => (c.id === cardId ? updated : c)),
      }));
    } catch (e) {
      // Rollback on error
      set({ cards: prevCards, error: String(e) });
    }
  },

  toggleSelect: (cardId: number) => {
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return { selectedIds: next };
    });
  },

  selectAll: () => {
    set((state) => ({
      selectedIds: new Set(state.cards.map((c) => c.id)),
    }));
  },

  invertSelection: () => {
    set((state) => {
      const allIds = new Set(state.cards.map((c) => c.id));
      const next = new Set<number>();
      for (const id of allIds) {
        if (!state.selectedIds.has(id)) next.add(id);
      }
      return { selectedIds: next };
    });
  },

  clearSelection: () => set({ selectedIds: new Set() }),

  batchMarkCollected: async () => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    try {
      await api.batchUpdate(Array.from(selectedIds), true);
      set((state) => ({
        cards: state.cards.map((c) =>
          state.selectedIds.has(c.id) ? { ...c, collected: true } : c
        ),
        selectedIds: new Set(),
      }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  batchMarkUncollected: async () => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    try {
      await api.batchUpdate(Array.from(selectedIds), false);
      set((state) => ({
        cards: state.cards.map((c) =>
          state.selectedIds.has(c.id) ? { ...c, collected: false } : c
        ),
        selectedIds: new Set(),
      }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  resetCollection: async () => {
    try {
      await api.resetCollection();
      set((state) => ({
        cards: state.cards.map((c) => ({ ...c, collected: false })),
        selectedIds: new Set(),
      }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  setSearchKeyword: (keyword: string) => set({ searchKeyword: keyword }),
}));
