// ─── User ──────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
}

// ─── Account ───────────────────────────────────────────────────────────────
export const PHASES = ["Free Trail", "Challenge", "Funded"] as const;
export type Phase = (typeof PHASES)[number];

export interface PropAccount {
  id: string;
  userId: string;
  name: string;
  propFirm: string;
  accountSize: number;
  currentBalance: number;
  startingBalance: number;
  dailyLossLimit: number;
  maxDrawdown: number;         // in percent, e.g. 10 means 10%
  profitTarget: number;        // in percent
  phase: Phase;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Trade ─────────────────────────────────────────────────────────────────
export type TradeType = "buy" | "sell";
export type Session = "London" | "New York" | "Asian" | "Pre-Market" | "Other";
export type TradeTag = "A+ Setup" | "B Setup" | "Revenge Trade" | "News Play" | "FOMO" | "Scalp" | "";

export interface Trade {
  id: string;
  accountId: string;
  userId: string;
  date: string;           // ISO date string YYYY-MM-DD
  pair: string;           // e.g. "XAUUSD"
  type: TradeType;
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  stopLoss: number;
  takeProfit: number;
  riskPercent: number;
  pnl: number;            // in USD
  rrr: number;            // risk:reward ratio, auto-calculated
  session: Session;
  tag: TradeTag;
  notes: string;
  imageUrl?: string;      // screenshot stored in Firebase/Supabase Storage
  createdAt: Date;
  updatedAt: Date;
}

export type NewTrade = Omit<Trade, "id" | "createdAt" | "updatedAt">;

// ─── Analytics ─────────────────────────────────────────────────────────────
export interface DailyStats {
  date: string;
  pnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
}

export interface AccountStats {
  totalPnl: number;
  winRate: number;
  avgRR: number;
  profitFactor: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  bestDay: { date: string; pnl: number };
  worstDay: { date: string; pnl: number };
  avgWin: number;
  avgLoss: number;
  maxConsecWins: number;
  maxConsecLosses: number;
  tradingDays: number;
  currentStreak: number;
}

// ─── UI State ──────────────────────────────────────────────────────────────
export type ViewTab = "dashboard" | "calendar" | "table" | "grid" | "analytics" | "accounts";

export interface AppState {
  activeAccountId: string | null;
  activeView: ViewTab;
  selectedMonth: Date;
}

// ─── Filters ───────────────────────────────────────────────────────────────
export interface TradeFilters {
  pair?: string;
  type?: TradeType;
  session?: Session;
  tag?: TradeTag;
  result?: "profit" | "loss";
  dateFrom?: string;
  dateTo?: string;
}
