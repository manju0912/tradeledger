// src/components/calendar/CalendarView.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Monthly calendar heatmap — the signature view of the app.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isToday, addMonths, subMonths, getDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useStore } from "@/store";
import { useTrades } from "@/hooks/useTrades";
import { buildDailyStats, fmtPnl } from "@/utils/calculations";
import { cn } from "@/utils/cn";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView() {
  useTrades();
  const trades = useStore((s) => s.trades);
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);

  const dailyStats = buildDailyStats(trades, month);

  const totalPnl = Object.values(dailyStats).reduce((s, d) => s + d.pnl, 0);
  const tradingDays = Object.values(dailyStats).filter((d) => d.tradeCount > 0).length;
  const totalTrades = Object.values(dailyStats).reduce((s, d) => s + d.tradeCount, 0);

  const monthStart = startOfMonth(month);
  // Calendar offset: Sunday = 0
  const startOffset = getDay(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(month) });

  const selectedStats = selected ? dailyStats[selected] : null;
  const selectedTrades = selected ? trades.filter((t) => t.date === selected) : [];

  return (
    <div className="p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {format(month, "MMMM yyyy")}
          </h1>
          <p className="mt-0.5 font-mono text-[11px] text-white/40">
            Net:{" "}
            <span className={totalPnl >= 0 ? "text-[#00d68f]" : "text-[#ff4d6a]"}>
              {fmtPnl(totalPnl)}
            </span>{" "}
            · {totalTrades} trades · {tradingDays} trading days
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMonth(subMonths(month, 1))}
            className="rounded-lg border border-white/[0.09] p-1.5 text-white/40 hover:border-white/20 hover:text-white/80 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setMonth(new Date())}
            className="rounded-lg border border-white/[0.09] px-3 py-1.5 text-[11px] text-white/40 hover:border-white/20 hover:text-white/80 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setMonth(addMonths(month, 1))}
            className="rounded-lg border border-white/[0.09] p-1.5 text-white/40 hover:border-white/20 hover:text-white/80 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Summary pills */}
      <div className="mb-4 flex gap-3">
        <StatPill
          icon={<TrendingUp size={12} />}
          label="Best Day"
          value={Object.values(dailyStats).reduce((b, d) => d.pnl > b ? d.pnl : b, 0)}
        />
        <StatPill
          icon={<TrendingDown size={12} />}
          label="Worst Day"
          value={Object.values(dailyStats).reduce((b, d) => d.pnl < b ? d.pnl : b, 0)}
        />
        <StatPill
          icon={<Calendar size={12} />}
          label="Trading Days"
          value={tradingDays}
          raw
        />
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-[3px]">
        {DOW.map((d) => (
          <div key={d} className="py-1 text-center font-mono text-[10px] text-white/25">
            {d}
          </div>
        ))}
        {/* Empty offset cells */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[72px] rounded-lg border border-white/[0.06] bg-[#111118]/40 opacity-30" />
        ))}
        {/* Day cells */}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const stats = dailyStats[key];
          const hasTrades = stats?.tradeCount > 0;
          const isProfit = hasTrades && stats.pnl > 0;
          const isLoss = hasTrades && stats.pnl < 0;
          const isSelected = selected === key;
          const isWeekend = getDay(day) === 0 || getDay(day) === 6;

          return (
            <div
              key={key}
              onClick={() => hasTrades && setSelected(isSelected ? null : key)}
              className={cn(
                "relative min-h-[72px] rounded-lg border p-2 transition-all",
                hasTrades ? "cursor-pointer" : "cursor-default",
                isWeekend && !hasTrades && "opacity-30",
                !hasTrades && "border-white/[0.06] bg-[#111118]/60",
                isProfit && "border-[#00d68f33] bg-[#00d68f0d] hover:bg-[#00d68f15]",
                isLoss && "border-[#ff4d6a33] bg-[#ff4d6a0d] hover:bg-[#ff4d6a15]",
                isToday(day) && "!border-[#7c6af7] ring-1 ring-[#7c6af7]/30",
                isSelected && "ring-2 ring-offset-0",
                isSelected && isProfit && "ring-[#00d68f]",
                isSelected && isLoss && "ring-[#ff4d6a]",
              )}
            >
              <span className={cn("font-mono text-[11px]", isToday(day) ? "text-[#a78bfa]" : "text-white/30")}>
                {format(day, "d")}
              </span>
              {hasTrades && (
                <>
                  <div className={cn(
                    "mt-1.5 font-mono text-[16px] font-semibold tracking-tight",
                    isProfit ? "text-[#00d68f]" : "text-[#ff4d6a]"
                  )}>
                    {fmtPnl(stats.pnl)}
                  </div>
                  <div className="mt-0.5 font-mono text-[9px] text-white/30">
                    {stats.tradeCount} trade{stats.tradeCount !== 1 ? "s" : ""}
                  </div>
                  <div className="mt-1.5 flex gap-[2px]">
                    {Array.from({ length: Math.min(stats.winCount, 5) }).map((_, i) => (
                      <div key={i} className="h-[4px] w-[4px] rounded-full bg-[#00d68f]" />
                    ))}
                    {Array.from({ length: Math.min(stats.lossCount, 5) }).map((_, i) => (
                      <div key={i} className="h-[4px] w-[4px] rounded-full bg-[#ff4d6a]" />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Day detail panel */}
      {selected && selectedStats && selectedTrades.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/[0.09] bg-[#111118] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">
              {selected} —{" "}
              <span className={selectedStats.pnl >= 0 ? "text-[#00d68f]" : "text-[#ff4d6a]"}>
                {fmtPnl(selectedStats.pnl)}
              </span>
            </h3>
            <button onClick={() => setSelected(null)} className="text-[11px] text-white/30 hover:text-white/60">
              close ×
            </button>
          </div>
          <div className="space-y-2">
            {selectedTrades.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#16161f] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium",
                    t.type === "buy"
                      ? "border-[#00d68f33] bg-[#00d68f15] text-[#00d68f]"
                      : "border-[#ff4d6a33] bg-[#ff4d6a15] text-[#ff4d6a]"
                  )}>
                    {t.type.toUpperCase()}
                  </span>
                  <span className="font-mono text-[12px] font-medium">{t.pair}</span>
                  <span className="text-[11px] text-white/30">{t.session}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-white/40">{t.rrr.toFixed(2)}R</span>
                  <span className={cn("font-mono text-[12px] font-semibold", t.pnl >= 0 ? "text-[#00d68f]" : "text-[#ff4d6a]")}>
                    {fmtPnl(t.pnl)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({
  icon, label, value, raw,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  raw?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-[#111118] px-3 py-1.5">
      <span className="text-white/30">{icon}</span>
      <span className="text-[11px] text-white/40">{label}</span>
      <span className={cn(
        "font-mono text-[11px] font-medium",
        raw ? "text-white/70" : value >= 0 ? "text-[#00d68f]" : "text-[#ff4d6a]"
      )}>
        {raw ? value : fmtPnl(value)}
      </span>
    </div>
  );
}
