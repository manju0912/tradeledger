// src/utils/calculations.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pure calculation functions — no side effects, easy to unit-test.
// ─────────────────────────────────────────────────────────────────────────────
import type { Trade, DailyStats, AccountStats, TradeType } from "@/types";
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";

/**
 * Auto-calculate Risk:Reward Ratio from entry/SL/TP prices.
 * Returns a positive number for a profitable RRR, negative for a riskier one.
 */
export function calculateRRR(
  type: TradeType,
  entry: number,
  sl: number,
  tp: number
): number {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk === 0) return 0;
  const ratio = reward / risk;
  return type === "buy"
    ? tp > entry ? ratio : -ratio
    : tp < entry ? ratio : -ratio;
}

/**
 * Group trades by calendar date and return daily stats for the given month.
 */
export function buildDailyStats(
  trades: Trade[],
  month: Date
): Record<string, DailyStats> {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });

  const result: Record<string, DailyStats> = {};

  for (const day of days) {
    const key = format(day, "yyyy-MM-dd");
    result[key] = { date: key, pnl: 0, tradeCount: 0, winCount: 0, lossCount: 0 };
  }

  for (const trade of trades) {
    const key = trade.date;
    if (!result[key]) continue;
    result[key].pnl += trade.pnl;
    result[key].tradeCount++;
    if (trade.pnl >= 0) result[key].winCount++;
    else result[key].lossCount++;
  }

  return result;
}

/**
 * Compute aggregate analytics from a flat list of trades.
 */
export function computeStats(trades: Trade[]): AccountStats {
  if (trades.length === 0) {
    return {
      totalPnl: 0, winRate: 0, avgRR: 0, profitFactor: 0,
      totalTrades: 0, winCount: 0, lossCount: 0,
      bestDay: { date: "—", pnl: 0 }, worstDay: { date: "—", pnl: 0 },
      avgWin: 0, avgLoss: 0, maxConsecWins: 0, maxConsecLosses: 0,
      tradingDays: 0, currentStreak: 0,
    };
  }

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);

  const totalWin = wins.reduce((s, t) => s + t.pnl, 0);
  const totalLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

  // Daily aggregation
  const byDay: Record<string, number> = {};
  for (const t of trades) {
    byDay[t.date] = (byDay[t.date] ?? 0) + t.pnl;
  }
  const dayEntries = Object.entries(byDay);
  const bestDay = dayEntries.reduce(
    (b, [d, p]) => (p > b.pnl ? { date: d, pnl: p } : b),
    { date: "", pnl: -Infinity }
  );
  const worstDay = dayEntries.reduce(
    (b, [d, p]) => (p < b.pnl ? { date: d, pnl: p } : b),
    { date: "", pnl: Infinity }
  );

  // Consecutive win/loss streaks
  let maxW = 0, maxL = 0, cur = 0, currentStreak = 0;
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  for (const t of sorted) {
    if (t.pnl > 0) {
      cur = cur > 0 ? cur + 1 : 1;
    } else {
      cur = cur < 0 ? cur - 1 : -1;
    }
    if (cur > 0) maxW = Math.max(maxW, cur);
    else maxL = Math.max(maxL, Math.abs(cur));
  }
  currentStreak = cur;

  return {
    totalPnl: totalWin - totalLoss,
    winRate: (wins.length / trades.length) * 100,
    avgRR: trades.reduce((s, t) => s + t.rrr, 0) / trades.length,
    profitFactor: totalLoss === 0 ? Infinity : totalWin / totalLoss,
    totalTrades: trades.length,
    winCount: wins.length,
    lossCount: losses.length,
    bestDay,
    worstDay,
    avgWin: wins.length ? totalWin / wins.length : 0,
    avgLoss: losses.length ? totalLoss / losses.length : 0,
    maxConsecWins: maxW,
    maxConsecLosses: maxL,
    tradingDays: Object.keys(byDay).length,
    currentStreak,
  };
}

/**
 * Export trades array to CSV and trigger browser download.
 */
export function exportToCsv(trades: Trade[]): void {
  const headers = [
    "Date", "Pair", "Type", "Entry", "Exit", "Lots",
    "SL", "TP", "Risk%", "PnL", "RRR", "Session", "Tag", "Notes",
  ];
  const rows = trades.map((t) => [
    t.date, t.pair, t.type, t.entryPrice, t.exitPrice, t.lotSize,
    t.stopLoss, t.takeProfit, t.riskPercent, t.pnl, t.rrr.toFixed(2),
    t.session, t.tag, `"${t.notes.replace(/"/g, '""')}"`,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trades_${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Format a currency value with sign */
export function fmtPnl(value: number, decimals = 0): string {
  const abs = Math.abs(value).toFixed(decimals);
  return value >= 0 ? `+$${abs}` : `-$${abs}`;
}

/** Clamp a value between min and max */
export function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}
