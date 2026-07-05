// src/components/analytics/Analytics.tsx
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useStore } from "@/store";
import { useTrades } from "@/hooks/useTrades";
import { computeStats, buildDailyStats, fmtPnl } from "@/utils/calculations";
import { format } from "date-fns";

const COLORS = { win: "#00d68f", loss: "#ff4d6a", accent: "#7c6af7" };

export default function Analytics() {
  useTrades();
  const trades = useStore((s) => s.trades);
  const month = useStore((s) => s.selectedMonth);

  const stats = computeStats(trades);
  const dailyStats = buildDailyStats(trades, month);

  // Build cumulative equity
  let cum = 0;
  const equityCurve = Object.entries(dailyStats)
    .filter(([, d]) => d.tradeCount > 0)
    .map(([date, d]) => {
      cum += d.pnl;
      return { date: format(new Date(date), "MMM d"), pnl: d.pnl, equity: cum };
    });

  // P&L bar data
  const pnlBars = Object.entries(dailyStats)
    .filter(([, d]) => d.tradeCount > 0)
    .map(([date, d]) => ({
      date: format(new Date(date), "d"),
      pnl: d.pnl,
      fill: d.pnl >= 0 ? COLORS.win : COLORS.loss,
    }));

  // Pair breakdown
  const pairMap: Record<string, number> = {};
  for (const t of trades) {
    pairMap[t.pair] = (pairMap[t.pair] ?? 0) + t.pnl;
  }
  const pairData = Object.entries(pairMap)
    .sort((a, b) => b[1] - a[1])
    .map(([pair, pnl]) => ({ pair, pnl }));

  const winLossData = [
    { name: "Wins", value: stats.winCount },
    { name: "Losses", value: stats.lossCount },
  ];

  return (
    <div className="space-y-4 p-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {[
          { label: "NET P&L", val: fmtPnl(stats.totalPnl), color: stats.totalPnl >= 0 ? COLORS.win : COLORS.loss },
          { label: "WIN RATE", val: `${stats.winRate.toFixed(1)}%`, color: "#a78bfa" },
          { label: "AVG R:R", val: `${stats.avgRR.toFixed(2)}`, color: "#f5c518" },
          { label: "PROFIT FACTOR", val: isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : "∞", color: COLORS.win },
          { label: "AVG WIN", val: fmtPnl(stats.avgWin), color: COLORS.win },
          { label: "AVG LOSS", val: fmtPnl(-stats.avgLoss), color: COLORS.loss },
        ].map(({ label, val, color }) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-[#111118] p-3">
            <div className="mb-1.5 font-mono text-[10px] text-white/30">{label}</div>
            <div className="font-mono text-[18px] font-semibold" style={{ color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Equity curve */}
      <div className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
        <h3 className="mb-3 font-mono text-[11px] text-white/40">CUMULATIVE EQUITY</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={equityCurve}>
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d68f" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00d68f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="date" tick={{ fill: "#55556880", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#55556880", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{ background: "#16161f", border: "1px solid #ffffff18", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [fmtPnl(v), "Cumulative"]}
            />
            <Area type="monotone" dataKey="equity" stroke="#00d68f" strokeWidth={1.5} fill="url(#equityGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Daily P&L bar */}
        <div className="col-span-2 rounded-xl border border-white/[0.06] bg-[#111118] p-4">
          <h3 className="mb-3 font-mono text-[11px] text-white/40">DAILY P&L</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pnlBars}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#55556880", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#55556880", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "#16161f", border: "1px solid #ffffff18", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [fmtPnl(v), "P&L"]}
              />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                {pnlBars.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Win / Loss donut */}
        <div className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
          <h3 className="mb-3 font-mono text-[11px] text-white/40">WIN / LOSS</h3>
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="flex items-center gap-1.5 text-[11px] text-white/50">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.win }} />
              Wins {stats.winCount}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-white/50">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.loss }} />
              Losses {stats.lossCount}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={winLossData} cx="50%" cy="50%" innerRadius={42} outerRadius={60} dataKey="value" paddingAngle={3}>
                <Cell fill={COLORS.win} />
                <Cell fill={COLORS.loss} />
              </Pie>
              <Tooltip
                contentStyle={{ background: "#16161f", border: "1px solid #ffffff18", borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 text-center font-mono text-[22px] font-semibold" style={{ color: "#a78bfa" }}>
            {stats.winRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Pair breakdown */}
      <div className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
        <h3 className="mb-3 font-mono text-[11px] text-white/40">P&L BY INSTRUMENT</h3>
        <ResponsiveContainer width="100%" height={Math.max(120, pairData.length * 40)}>
          <BarChart data={pairData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#55556880", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <YAxis type="category" dataKey="pair" tick={{ fill: "#9090a8", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} width={60} />
            <Tooltip
              contentStyle={{ background: "#16161f", border: "1px solid #ffffff18", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [fmtPnl(v), "P&L"]}
            />
            <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
              {pairData.map((entry, i) => (
                <Cell key={i} fill={entry.pnl >= 0 ? COLORS.accent : COLORS.loss} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Streak info */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "MAX WIN STREAK", val: stats.maxConsecWins, color: COLORS.win },
          { label: "MAX LOSS STREAK", val: stats.maxConsecLosses, color: COLORS.loss },
          { label: "TRADING DAYS", val: stats.tradingDays, color: "#a78bfa" },
          { label: "CURRENT STREAK", val: stats.currentStreak > 0 ? `+${stats.currentStreak}W` : `${Math.abs(stats.currentStreak)}L`, color: stats.currentStreak > 0 ? COLORS.win : COLORS.loss },
        ].map(({ label, val, color }) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-[#111118] p-3">
            <div className="mb-1 font-mono text-[10px] text-white/30">{label}</div>
            <div className="font-mono text-[22px] font-semibold" style={{ color }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
