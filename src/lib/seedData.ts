// src/lib/seedData.ts
// ─────────────────────────────────────────────────────────────────────────────
// Development / demo seed data.
// Call seedDemoData(userId, accountId) once after creating a test account.
// ─────────────────────────────────────────────────────────────────────────────
import { createTrade } from "@/services/firestore";
import type { NewTrade } from "@/types";

const SEED_TRADES: Omit<NewTrade, "accountId" | "userId">[] = [
  { date: "2025-05-01", pair: "XAUUSD", type: "buy",  entryPrice: 2310.50, exitPrice: 2318.80, lotSize: 0.5, stopLoss: 2305.00, takeProfit: 2320.00, riskPercent: 1.0, pnl: 415,  rrr: 1.6, session: "London",   tag: "A+ Setup", notes: "Clean breakout above 2310 resistance. London session momentum trade." },
  { date: "2025-05-01", pair: "EURUSD", type: "sell", entryPrice: 1.0842,  exitPrice: 1.0821,  lotSize: 1.0, stopLoss: 1.0860,  takeProfit: 1.0820,  riskPercent: 0.8, pnl: 210,  rrr: 1.2, session: "London",   tag: "",        notes: "CPI data play, NY open continuation sell." },
  { date: "2025-05-02", pair: "US30",   type: "buy",  entryPrice: 38420,   exitPrice: 38510,   lotSize: 0.1, stopLoss: 38370,   takeProfit: 38500,   riskPercent: 1.2, pnl: 180,  rrr: 1.8, session: "New York", tag: "A+ Setup", notes: "Gap fill trade. Strong opening momentum." },
  { date: "2025-05-05", pair: "NAS100", type: "sell", entryPrice: 17840,   exitPrice: 17790,   lotSize: 0.1, stopLoss: 17880,   takeProfit: 17800,   riskPercent: 1.0, pnl: 200,  rrr: 1.3, session: "New York", tag: "",        notes: "Tech sell-off continuation." },
  { date: "2025-05-06", pair: "XAUUSD", type: "buy",  entryPrice: 2295,    exitPrice: 2280,    lotSize: 0.3, stopLoss: 2288,    takeProfit: 2310,    riskPercent: 1.0, pnl: -210, rrr:-2.1, session: "London",   tag: "",        notes: "Fakeout. Should have waited for London confirmation candle." },
  { date: "2025-05-07", pair: "GBPUSD", type: "sell", entryPrice: 1.2540,  exitPrice: 1.2512,  lotSize: 0.8, stopLoss: 1.2560,  takeProfit: 1.2510,  riskPercent: 0.9, pnl: 224,  rrr: 1.4, session: "London",   tag: "A+ Setup", notes: "POI rejection off 1.2550 level, good RR." },
  { date: "2025-05-08", pair: "EURUSD", type: "buy",  entryPrice: 1.0810,  exitPrice: 1.0790,  lotSize: 1.0, stopLoss: 1.0795,  takeProfit: 1.0835,  riskPercent: 1.0, pnl: -200, rrr:-1.3, session: "New York", tag: "",        notes: "News spike stopped me out. Avoid trading 15 min before FOMC." },
  { date: "2025-05-09", pair: "XAUUSD", type: "buy",  entryPrice: 2305,    exitPrice: 2320,    lotSize: 0.5, stopLoss: 2298,    takeProfit: 2322,    riskPercent: 1.2, pnl: 375,  rrr: 2.1, session: "London",   tag: "A+ Setup", notes: "Perfect London breakout structure with clean BOS." },
  { date: "2025-05-12", pair: "US30",   type: "sell", entryPrice: 38600,   exitPrice: 38520,   lotSize: 0.1, stopLoss: 38650,   takeProfit: 38540,   riskPercent: 1.0, pnl: 160,  rrr: 1.6, session: "New York", tag: "",        notes: "" },
  { date: "2025-05-13", pair: "NAS100", type: "buy",  entryPrice: 17920,   exitPrice: 17980,   lotSize: 0.1, stopLoss: 17880,   takeProfit: 18000,   riskPercent: 1.1, pnl: 300,  rrr: 2.0, session: "New York", tag: "A+ Setup", notes: "Earnings catalyst breakout, clean structure." },
  { date: "2025-05-14", pair: "XAUUSD", type: "buy",  entryPrice: 2330,    exitPrice: 2355,    lotSize: 0.8, stopLoss: 2318,    takeProfit: 2356,    riskPercent: 1.5, pnl: 842,  rrr: 2.2, session: "London",   tag: "A+ Setup", notes: "Major breakout above 2330 key level. Best day this month!" },
  { date: "2025-05-15", pair: "EURUSD", type: "sell", entryPrice: 1.0890,  exitPrice: 1.0865,  lotSize: 1.0, stopLoss: 1.0910,  takeProfit: 1.0860,  riskPercent: 1.0, pnl: 125,  rrr: 1.6, session: "London",   tag: "",        notes: "Range breakout sell from resistance." },
  { date: "2025-05-16", pair: "GBPUSD", type: "buy",  entryPrice: 1.2480,  exitPrice: 1.2462,  lotSize: 0.5, stopLoss: 1.2460,  takeProfit: 1.2510,  riskPercent: 0.8, pnl: -88,  rrr:-0.9, session: "Asian",    tag: "",        notes: "Asian session low liquidity. Spreads were wider than expected." },
  { date: "2025-05-19", pair: "XAUUSD", type: "buy",  entryPrice: 2340,    exitPrice: 2350,    lotSize: 0.5, stopLoss: 2332,    takeProfit: 2355,    riskPercent: 1.0, pnl: 210,  rrr: 1.9, session: "London",   tag: "A+ Setup", notes: "Pullback to 2340 support after Monday gap." },
  { date: "2025-05-20", pair: "US30",   type: "buy",  entryPrice: 38700,   exitPrice: 38810,   lotSize: 0.1, stopLoss: 38640,   takeProfit: 38820,   riskPercent: 1.2, pnl: 330,  rrr: 1.8, session: "New York", tag: "A+ Setup", notes: "Fed minutes reaction. Bullish continuation." },
  { date: "2025-05-21", pair: "NAS100", type: "sell", entryPrice: 18100,   exitPrice: 18056,   lotSize: 0.1, stopLoss: 18140,   takeProfit: 18060,   riskPercent: 1.0, pnl: 176,  rrr: 1.1, session: "New York", tag: "",        notes: "" },
];

export async function seedDemoData(userId: string, accountId: string): Promise<void> {
  for (const trade of SEED_TRADES) {
    await createTrade(userId, { ...trade, accountId, userId });
    // Small delay to respect Firestore write rate limits
    await new Promise((r) => setTimeout(r, 120));
  }
  console.log(`✅ Seeded ${SEED_TRADES.length} demo trades`);
}
