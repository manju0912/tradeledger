// src/store/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Global state with Zustand.  Keeps UI state + loaded data in one place.
// Async actions (fetches/mutations) live in React Query hooks — this store
// holds only derived / UI / auth state.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, PropAccount, Trade, ViewTab, TradeFilters } from "@/types";

interface AppStore {
  // ── Auth ─────────────────────────────────────────────────────────────────
  user: User | null;
  setUser: (user: User | null) => void;

  // ── Accounts ─────────────────────────────────────────────────────────────
  accounts: PropAccount[];
  activeAccountId: string | null;
  setAccounts: (accounts: PropAccount[]) => void;
  setActiveAccountId: (id: string | null) => void;

  // ── Trades ───────────────────────────────────────────────────────────────
  trades: Trade[];
  setTrades: (trades: Trade[]) => void;

  // ── UI ───────────────────────────────────────────────────────────────────
  activeView: ViewTab;
  setActiveView: (view: ViewTab) => void;
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  filters: TradeFilters;
  setFilters: (filters: Partial<TradeFilters>) => void;
  clearFilters: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const defaultFilters: TradeFilters = {};

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),

      // Accounts
      accounts: [],
      activeAccountId: null,
      setAccounts: (accounts) => set({ accounts }),
      setActiveAccountId: (id) => set({ activeAccountId: id }),

      // Trades
      trades: [],
      setTrades: (trades) => set({ trades }),

      // UI
      activeView: "dashboard",
      setActiveView: (activeView) => set({ activeView }),
      selectedMonth: new Date(),
      setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
      filters: defaultFilters,
      setFilters: (newFilters) =>
        set((state) => ({ filters: { ...state.filters, ...newFilters } })),
      clearFilters: () => set({ filters: defaultFilters }),
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "tradeledger-store",
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as Partial<AppStore>;
        return {
          activeAccountId: state.activeAccountId ?? null,
          activeView: state.activeView ?? "dashboard",
          sidebarCollapsed: state.sidebarCollapsed ?? false,
        };
      },
      // Only persist UI preferences, not data (data lives in Firestore)
      partialize: (state) => ({
        activeAccountId: state.activeAccountId,
        activeView: state.activeView,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
