// src/components/grid/ScreenshotGrid.tsx
import { useMemo, useState } from "react";
import { X, ImageOff, TrendingUp, TrendingDown, Tag } from "lucide-react";
import { useStore } from "@/store";
import { useTrades } from "@/hooks/useTrades";
import { fmtPnl } from "@/utils/calculations";
import { cn } from "@/utils/cn";
import type { Trade } from "@/types";

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function ScreenshotGrid() {
  useTrades();
  const trades = useStore((s) => s.trades);
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [selected, setSelected] = useState<Trade | null>(null);
  const filteredTrades = useMemo(
    () => trades.filter((trade) => !filterMonth || trade.date.startsWith(filterMonth)),
    [trades, filterMonth]
  );
  const totalPnl = useMemo(
    () => filteredTrades.reduce((sum, trade) => sum + trade.pnl, 0),
    [filteredTrades]
  );

  // Gradient placeholders when no screenshot is uploaded
  const GRADIENTS = [
    "from-[#7c6af710] to-[#16161f]",
    "from-[#00d68f10] to-[#16161f]",
    "from-[#ff4d6a10] to-[#16161f]",
    "from-[#f5c51810] to-[#16161f]",
  ];

  return (
    <>
      <div className="p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            className="h-[32px] rounded-lg border border-white/[0.09] bg-[#111118] px-2.5 font-mono text-[11px] text-white/70 outline-none transition-colors hover:border-white/20 focus:border-[#7c6af7]/60"
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
          {filterMonth && (
            <button
              onClick={() => setFilterMonth("")}
              className="rounded-lg border border-white/[0.09] px-2.5 py-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors"
            >
              All months
            </button>
          )}
          <div className="ml-auto flex items-center gap-3">
            <span className="font-mono text-[11px] text-white/30">
              {filteredTrades.length} screenshot{filteredTrades.length !== 1 ? "s" : ""}
            </span>
            <span className={cn("font-mono text-[12px] font-semibold", totalPnl >= 0 ? "text-[#00d68f]" : "text-[#ff4d6a]")}>
              {fmtPnl(totalPnl)}
            </span>
          </div>
        </div>

        {filteredTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-white/20">
            <ImageOff size={32} />
            <span className="text-[13px]">No screenshots for this month</span>
            <span className="text-[11px]">Adjust the month filter or log a trade with a chart screenshot</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredTrades.map((t, i) => (
              <TradeCard
                key={t.id}
                trade={t}
                gradient={GRADIENTS[i % GRADIENTS.length]}
                onClick={() => setSelected(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.09] bg-[#111118] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Screenshot */}
            <div className="relative">
              {selected.imageUrl ? (
                <img
                  src={selected.imageUrl}
                  alt="Trade screenshot"
                  className="h-64 w-full rounded-t-2xl object-cover"
                  loading="lazy"
                />
              ) : (
                <div className={cn(
                  "flex h-64 w-full items-center justify-center rounded-t-2xl bg-gradient-to-br",
                  GRADIENTS[0]
                )}>
                  <div className="flex flex-col items-center gap-2 text-white/20">
                    <ImageOff size={28} />
                    <span className="text-[12px]">No screenshot</span>
                  </div>
                </div>
              )}

              {/* Overlay badges on image */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className={cn(
                  "rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium uppercase backdrop-blur-sm",
                  selected.type === "buy"
                    ? "border-[#00d68f66] bg-[#00d68f30] text-[#00d68f]"
                    : "border-[#ff4d6a66] bg-[#ff4d6a30] text-[#ff4d6a]"
                )}>
                  {selected.type}
                </span>
                <span className="rounded-full border border-white/20 bg-black/50 px-2.5 py-1 font-mono text-[11px] font-medium backdrop-blur-sm">
                  {selected.pair}
                </span>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/70 backdrop-blur-sm hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Details */}
            <div className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-[16px] font-semibold">{selected.pair}</h2>
                  <p className="font-mono text-[11px] text-white/30">{selected.date} · {selected.session}</p>
                </div>
                <span className={cn(
                  "font-mono text-[20px] font-semibold",
                  selected.pnl >= 0 ? "text-[#00d68f]" : "text-[#ff4d6a]"
                )}>
                  {fmtPnl(selected.pnl)}
                </span>
              </div>

              {/* Stats grid */}
              <div className="mb-4 grid grid-cols-3 gap-2">
                {[
                  { label: "ENTRY", val: String(selected.entryPrice) },
                  { label: "EXIT", val: String(selected.exitPrice) },
                  { label: "LOTS", val: String(selected.lotSize) },
                  { label: "STOP LOSS", val: String(selected.stopLoss), danger: true },
                  { label: "TAKE PROFIT", val: String(selected.takeProfit), good: true },
                  { label: "RISK", val: `${selected.riskPercent}%` },
                ].map(({ label, val, danger, good }) => (
                  <div key={label} className="rounded-lg border border-white/[0.06] bg-[#16161f] p-2.5">
                    <p className="mb-1 font-mono text-[9px] text-white/30">{label}</p>
                    <p className={cn(
                      "font-mono text-[12px] font-medium",
                      danger ? "text-[#ff4d6a]" : good ? "text-[#00d68f]" : "text-white/70"
                    )}>
                      {val}
                    </p>
                  </div>
                ))}
              </div>

              {/* RRR */}
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#16161f] px-3 py-2.5">
                {selected.rrr >= 0 ? (
                  <TrendingUp size={14} className="text-[#a78bfa]" />
                ) : (
                  <TrendingDown size={14} className="text-[#ff4d6a]" />
                )}
                <span className="text-[12px] text-white/40">Risk : Reward</span>
                <span className={cn(
                  "ml-auto font-mono text-[14px] font-semibold",
                  selected.rrr >= 1.5 ? "text-[#a78bfa]" : selected.rrr >= 1 ? "text-white/70" : "text-[#ff4d6a]"
                )}>
                  {selected.rrr.toFixed(2)}R
                </span>
              </div>

              {/* Tag */}
              {selected.tag && (
                <div className="mb-4 flex items-center gap-2">
                  <Tag size={12} className="text-[#f5c518]" />
                  <span className="rounded-full border border-[#f5c51833] bg-[#f5c51815] px-3 py-0.5 font-mono text-[11px] text-[#f5c518]">
                    {selected.tag}
                  </span>
                </div>
              )}

              {/* Notes */}
              {selected.notes && (
                <div className="rounded-lg border border-white/[0.06] bg-[#16161f] p-3">
                  <p className="mb-1.5 font-mono text-[10px] text-white/30">NOTES</p>
                  <p className="text-[12px] leading-relaxed text-white/60">{selected.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TradeCard({
  trade, gradient, onClick,
}: {
  trade: Trade;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group flex h-[236px] cursor-pointer flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#111118] transition-all hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/30"
    >
      {/* Screenshot / Placeholder */}
      <div className="relative h-[170px] overflow-hidden bg-black/30">
        {trade.imageUrl ? (
          <img
            src={trade.imageUrl}
            alt={`${trade.pair} screenshot`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className={cn(
            "flex h-full w-full items-center justify-center bg-gradient-to-br",
            gradient
          )}>
            <div className="flex flex-col items-center gap-1.5 text-white/15">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 3v18h18" /><path d="m7 16 4-6 4 4 4-8" />
              </svg>
              <span className="font-mono text-[9px]">{trade.pair}</span>
            </div>
          </div>
        )}
        {/* P&L overlay badge */}
        <div className={cn(
          "absolute bottom-2 right-2 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold backdrop-blur-sm",
          trade.pnl >= 0
            ? "border-[#00d68f44] bg-[#00d68f25] text-[#00d68f]"
            : "border-[#ff4d6a44] bg-[#ff4d6a25] text-[#ff4d6a]"
        )}>
          {fmtPnl(trade.pnl)}
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[12px] font-medium">{trade.pair}</span>
          <span className={cn(
            "rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase",
            trade.type === "buy"
              ? "border-[#00d68f33] text-[#00d68f]"
              : "border-[#ff4d6a33] text-[#ff4d6a]"
          )}>
            {trade.type}
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <span className="rounded border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 text-[9px] text-white/35">
            {trade.session}
          </span>
          {trade.tag && (
            <span className="rounded-full border border-[#f5c51833] bg-[#f5c51815] px-1.5 py-0.5 font-mono text-[9px] text-[#f5c518]">
              {trade.tag}
            </span>
          )}
          <span className={cn(
            "ml-auto font-mono text-[10px]",
            trade.rrr >= 1.5 ? "text-[#a78bfa]" : "text-white/30"
          )}>
            {trade.rrr.toFixed(1)}R
          </span>
        </div>

        <p className="mt-auto font-mono text-[10px] text-white/20">{trade.date}</p>
      </div>
    </div>
  );
}
