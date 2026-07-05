// src/components/dashboard/Dashboard.tsx
import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { TrendingUp, TrendingDown, Activity, Target, Award, Calendar } from "lucide-react";
import { useStore } from "@/store";
import { useAccounts, useTrades } from "@/hooks/useTrades";
import { computeStats, buildDailyStats, fmtPnl } from "@/utils/calculations";
import { cn } from "@/utils/cn";

export default function Dashboard() {
  useAccounts();
  useTrades();

  const { trades, accounts, activeAccountId } = useStore();
  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  const month = useMemo(() => new Date(), []);
  const stats = useMemo(() => computeStats(trades), [trades]);
  const dailyStats = useMemo(() => buildDailyStats(trades, month), [trades, month]);

  // Mini equity sparkline data
  const equityData = useMemo(() => {
    let cum = 0;
    return Object.entries(dailyStats)
      .filter(([, d]) => d.tradeCount > 0)
      .map(([date, d]) => {
        cum += d.pnl;
        return { date: date.slice(8), equity: cum };
      });
  }, [dailyStats]);

  // Account rule checks
  const ddUsed = activeAccount
    ? Math.abs((stats.totalPnl / activeAccount.accountSize) * 100)
    : 0;
  const ddLimit = activeAccount?.maxDrawdown ?? 10;
  const ddSafe = ddUsed < ddLimit * 0.6;
  const ddWarning = ddUsed >= ddLimit * 0.6 && ddUsed < ddLimit * 0.9;
  const ddDanger = ddUsed >= ddLimit * 0.9;

  return (
    <div className="p-5 space-y-5">
      {/* ── KPI Strip ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="NET P&L"
          value={fmtPnl(stats.totalPnl)}
          sub={`${stats.totalPnl >= 0 ? "↑" : "↓"} ${Math.abs(stats.totalPnl / (activeAccount?.accountSize ?? 100000) * 100).toFixed(2)}% balance`}
          color={stats.totalPnl >= 0 ? "#00d68f" : "#ff4d6a"}
          accentTop={stats.totalPnl >= 0 ? "#00d68f" : "#ff4d6a"}
        />
        <KpiCard
          label="WIN RATE"
          value={`${stats.winRate.toFixed(1)}%`}
          sub={`${stats.winCount} / ${stats.totalTrades} trades`}
          color="#a78bfa"
          accentTop="#7c6af7"
        />
        <KpiCard
          label="AVG R:R"
          value={stats.avgRR.toFixed(2)}
          sub={`Profit factor ${isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(1) : "∞"}`}
          color="#f5c518"
          accentTop="#f5c518"
        />
        <KpiCard
          label="BEST DAY"
          value={fmtPnl(stats.bestDay.pnl)}
          sub={stats.bestDay.date || "—"}
          color="#00d68f"
          accentTop="#00d68f"
        />
        <KpiCard
          label="WORST DAY"
          value={fmtPnl(stats.worstDay.pnl)}
          sub={stats.worstDay.date || "—"}
          color="#ff4d6a"
          accentTop="#ff4d6a"
        />
        <KpiCard
          label="TOTAL TRADES"
          value={String(stats.totalTrades)}
          sub={`${stats.tradingDays} trading days`}
          color="#a78bfa"
          accentTop="#7c6af7"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Equity Sparkline ────────────────────────────────────────── */}
        <div className="col-span-2 rounded-xl border border-white/[0.06] bg-[#111118] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] text-white/30">EQUITY CURVE · {format(month, "MMMM yyyy")}</p>
              <p className={cn("mt-1 font-mono text-[22px] font-semibold", stats.totalPnl >= 0 ? "text-[#00d68f]" : "text-[#ff4d6a]")}>
                {fmtPnl(stats.totalPnl)}
              </p>
            </div>
            <div className={cn(
              "flex items-center gap-1 rounded-full px-3 py-1 text-[11px]",
              stats.totalPnl >= 0
                ? "bg-[#00d68f15] text-[#00d68f]"
                : "bg-[#ff4d6a15] text-[#ff4d6a]"
            )}>
              {stats.totalPnl >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.totalPnl / (activeAccount?.accountSize ?? 100000) * 100).toFixed(2)}%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d68f" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#00d68f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="date" tick={{ fill: "#444", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#444", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "#16161f", border: "1px solid #ffffff18", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [fmtPnl(v), "Net P&L"]}
              />
              <Area type="monotone" dataKey="equity" stroke="#00d68f" strokeWidth={1.5} fill="url(#eqGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Account Health ──────────────────────────────────────────── */}
        <div className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
          <p className="mb-4 font-mono text-[10px] text-white/30">ACCOUNT HEALTH</p>

          {activeAccount ? (
            <div className="space-y-4">
              {/* Phase badge */}
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium">{activeAccount.name}</span>
                <span className={cn(
                  "rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium",
                  activeAccount.phase === "Funded"
                    ? "border-[#00d68f33] bg-[#00d68f15] text-[#00d68f]"
                    : "border-[#f5c51833] bg-[#f5c51815] text-[#f5c518]"
                )}>
                  {activeAccount.phase.toUpperCase()}
                </span>
              </div>

              {/* Rule meters */}
              <RuleMeter
                label="Drawdown Used"
                current={ddUsed}
                max={ddLimit}
                unit="%"
                danger={ddDanger}
                warning={ddWarning}
              />
              <RuleMeter
                label="Profit Progress"
                current={Math.max(0, stats.totalPnl / activeAccount.accountSize * 100)}
                max={activeAccount.profitTarget}
                unit="%"
                good
              />

              {/* Quick stats */}
              <div className="space-y-2 pt-1">
                {[
                  { label: "Account Size", val: `$${activeAccount.accountSize.toLocaleString()}` },
                  { label: "Current Balance", val: `$${(activeAccount.startingBalance + stats.totalPnl).toLocaleString()}` },
                  { label: "Daily Loss Limit", val: `$${Math.abs(activeAccount.dailyLossLimit).toLocaleString()}`, danger: true },
                  { label: "Max Drawdown", val: `${activeAccount.maxDrawdown}%`, danger: true },
                ].map(({ label, val, danger }) => (
                  <div key={label} className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                    <span className="text-[11px] text-white/40">{label}</span>
                    <span className={cn("font-mono text-[11px] font-medium", danger ? "text-[#ff4d6a]" : "text-white/70")}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-white/20">
              <Target size={24} />
              <span className="text-[12px]">No account selected</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Mini Calendar ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] text-white/30">CALENDAR OVERVIEW · {format(month, "MMMM yyyy")}</p>
          <button
            onClick={() => useStore.getState().setActiveView("calendar")}
            className="text-[11px] text-[#7c6af7] hover:text-[#a78bfa] transition-colors"
          >
            View full calendar →
          </button>
        </div>
        <MiniCalendar dailyStats={dailyStats} month={month} />
      </div>

      {/* ── Recent Trades ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] text-white/30">RECENT TRADES</p>
          <button
            onClick={() => useStore.getState().setActiveView("table")}
            className="text-[11px] text-[#7c6af7] hover:text-[#a78bfa] transition-colors"
          >
            View all →
          </button>
        </div>
        {trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-white/20">
            <Activity size={24} />
            <span className="text-[12px]">No trades logged yet</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {trades.slice(0, 6).map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-[#16161f] px-3 py-2.5 hover:border-white/[0.08] transition-colors"
              >
                <span className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] font-medium uppercase",
                  t.type === "buy"
                    ? "border-[#00d68f33] bg-[#00d68f10] text-[#00d68f]"
                    : "border-[#ff4d6a33] bg-[#ff4d6a10] text-[#ff4d6a]"
                )}>
                  {t.type}
                </span>
                <span className="font-mono text-[12px] font-medium">{t.pair}</span>
                <span className="text-[11px] text-white/30">{t.session}</span>
                <span className="text-[11px] text-white/20">{t.date}</span>
                {t.tag && (
                  <span className="rounded-full border border-[#f5c51833] bg-[#f5c51815] px-2 py-0.5 font-mono text-[9px] text-[#f5c518]">
                    {t.tag}
                  </span>
                )}
                <span className="font-mono text-[11px] text-white/30 ml-auto">{t.rrr.toFixed(2)}R</span>
                <span className={cn(
                  "font-mono text-[13px] font-semibold w-[70px] text-right",
                  t.pnl >= 0 ? "text-[#00d68f]" : "text-[#ff4d6a]"
                )}>
                  {fmtPnl(t.pnl)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color, accentTop,
}: {
  label: string; value: string; sub: string; color: string; accentTop: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111118] p-3">
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${accentTop}, transparent)` }}
      />
      <p className="mb-1.5 font-mono text-[10px] text-white/30">{label}</p>
      <p className="font-mono text-[18px] font-semibold leading-none" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 font-mono text-[10px] text-white/25">{sub}</p>
    </div>
  );
}

function RuleMeter({
  label, current, max, unit, danger, warning, good,
}: {
  label: string; current: number; max: number; unit: string;
  danger?: boolean; warning?: boolean; good?: boolean;
}) {
  const pct = Math.min(100, (current / max) * 100);
  const fillColor = good
    ? "#00d68f"
    : danger
    ? "#ff4d6a"
    : warning
    ? "#f5c518"
    : "#00d68f";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] text-white/40">{label}</span>
        <span className="font-mono text-[11px]" style={{ color: fillColor }}>
          {current.toFixed(1)}{unit} / {max}{unit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: fillColor }}
        />
      </div>
    </div>
  );
}

const DOW_MINI = ["S", "M", "T", "W", "T", "F", "S"];

function MiniCalendar({
  dailyStats,
  month,
}: {
  dailyStats: Record<string, { pnl: number; tradeCount: number }>;
  month: Date;
}) {
  const monthStart = startOfMonth(month);
  const startOffset = getDay(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(month) });

  return (
    <div className="grid grid-cols-7 gap-[3px]">
      {DOW_MINI.map((d, i) => (
        <div key={i} className="py-1 text-center font-mono text-[12px] text-white/20">{d}</div>
      ))}
      {Array.from({ length: startOffset }).map((_, i) => (
        <div key={`e-${i}`} className="h-[40px] rounded-md bg-white/[0.02] opacity-30" />
      ))}
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const d = dailyStats[key];
        const hasTrades = d?.tradeCount > 0;
        const isWeekend = getDay(day) === 0 || getDay(day) === 6;

        return (
          <div
            key={key}
            className={cn(
              "flex h-[80px] flex-col items-center justify-center gap-4 rounded-md border text-center transition-all",
              isWeekend && !hasTrades && "opacity-20",
              !hasTrades && "border-white/[0.04] bg-white/[0.02]",
              hasTrades && d.pnl > 0 && "border-[#00d68f33] bg-[#00d68f12]",
              hasTrades && d.pnl < 0 && "border-[#ff4d6a33] bg-[#ff4d6a12]",
            )}
          >
            <span className="font-mono text-[12px] text-white/25">{format(day, "d")}</span>
            {hasTrades && (
              <span className={cn("font-mono text-[16px] font-medium leading-none mt-0.5", d.pnl > 0 ? "text-[#00d68f]" : "text-[#ff4d6a]")}>
                {d.pnl > 0 ? "+" : ""}{(d.pnl)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
