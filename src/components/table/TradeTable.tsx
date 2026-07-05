// src/components/table/TradeTable.tsx
import { useState, useMemo } from "react";
import {
  ArrowUpDown, ArrowUp, ArrowDown, Trash2, Edit3,
  Search, X,
} from "lucide-react";
import { useStore } from "@/store";
import { useTrades, useDeleteTrade } from "@/hooks/useTrades";
import { LogTradeModal } from "@/components/modals/LogTradeModal";
import { fmtPnl } from "@/utils/calculations";
import { cn } from "@/utils/cn";
import type { Trade, TradeType, Session } from "@/types";

type SortField = keyof Pick<Trade, "date" | "pair" | "pnl" | "rrr" | "riskPercent" | "lotSize">;
type SortDir = "asc" | "desc";

const PAIRS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "US30", "NAS100", "USOIL", "BTCUSD", "SPX500"];
const SESSIONS: Session[] = ["London", "New York", "Asian", "Pre-Market", "Other"];
const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function TradeTable() {
  useTrades();

  const trades = useStore((s) => s.trades);
  const { mutate: deleteTrade } = useDeleteTrade();

  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: "date", dir: "desc" });
  const [filterPair, setFilterPair] = useState("");
  const [filterType, setFilterType] = useState<"" | TradeType>("");
  const [filterSession, setFilterSession] = useState<"" | Session>("");
  const [filterResult, setFilterResult] = useState<"" | "profit" | "loss">("");
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const filtered = useMemo(() => {
    return trades
      .filter((t) => {
        if (filterMonth && !t.date.startsWith(filterMonth)) return false;
        if (filterPair && t.pair !== filterPair) return false;
        if (filterType && t.type !== filterType) return false;
        if (filterSession && t.session !== filterSession) return false;
        if (filterResult === "profit" && t.pnl <= 0) return false;
        if (filterResult === "loss" && t.pnl >= 0) return false;
        if (search && !t.pair.toLowerCase().includes(search.toLowerCase()) && !t.notes.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const va = a[sort.field] as string | number;
        const vb = b[sort.field] as string | number;
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sort.dir === "asc" ? cmp : -cmp;
      });
  }, [trades, filterMonth, filterPair, filterType, filterSession, filterResult, search, sort]);

  const totalPnl = useMemo(() => filtered.reduce((s, t) => s + t.pnl, 0), [filtered]);
  const winRate = useMemo(() => {
    if (!filtered.length) return 0;
    return (filtered.filter((t) => t.pnl > 0).length / filtered.length) * 100;
  }, [filtered]);

  const hasFilters = filterPair || filterType || filterSession || filterResult || search;

  function toggleSort(field: SortField) {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "desc" }
    );
  }

  function clearFilters() {
    setFilterPair(""); setFilterType(""); setFilterSession("");
    setFilterResult(""); setSearch("");
  }

  return (
    <div className="p-5">
      {/* ── Filter Bar ───────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            className="h-[32px] rounded-lg border border-white/[0.09] bg-[#111118] pl-7 pr-3 font-mono text-[11px] text-white/80 placeholder-white/20 outline-none focus:border-[#7c6af7]/60 w-[180px]"
            placeholder="Search pair or notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

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

        <FilterSelect
          value={filterPair}
          onChange={setFilterPair}
          placeholder="All Pairs"
          options={PAIRS}
        />
        <FilterSelect
          value={filterType}
          onChange={(v) => setFilterType(v as "" | TradeType)}
          placeholder="All Types"
          options={["buy", "sell"]}
          labels={["Buy", "Sell"]}
        />
        <FilterSelect
          value={filterSession}
          onChange={(v) => setFilterSession(v as "" | Session)}
          placeholder="All Sessions"
          options={SESSIONS}
        />
        <FilterSelect
          value={filterResult}
          onChange={(v) => setFilterResult(v as "" | "profit" | "loss")}
          placeholder="All Results"
          options={["profit", "loss"]}
          labels={["Profit", "Loss"]}
        />

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg border border-white/[0.09] px-2.5 py-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors"
          >
            <X size={11} /> Clear
          </button>
        )}

        {/* Summary pills */}
        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-[11px] text-white/30">
            {filtered.length} trade{filtered.length !== 1 ? "s" : ""}
          </span>
          <span className={cn("font-mono text-[12px] font-semibold", totalPnl >= 0 ? "text-[#00d68f]" : "text-[#ff4d6a]")}>
            {fmtPnl(totalPnl)}
          </span>
          <span className="font-mono text-[11px] text-[#a78bfa]">
            {winRate.toFixed(0)}% WR
          </span>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#111118]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#16161f]">
                {[
                  { label: "DATE", field: "date" as SortField },
                  { label: "PAIR", field: "pair" as SortField },
                  { label: "TYPE" },
                  { label: "ENTRY" },
                  { label: "EXIT" },
                  { label: "LOTS", field: "lotSize" as SortField },
                  { label: "SL" },
                  { label: "TP" },
                  { label: "RISK%", field: "riskPercent" as SortField },
                  { label: "P&L", field: "pnl" as SortField },
                  { label: "RRR", field: "rrr" as SortField },
                  { label: "SESSION" },
                  { label: "TAG" },
                  { label: "NOTES" },
                  { label: "" },
                ].map(({ label, field }) => (
                  <th
                    key={label}
                    onClick={() => field && toggleSort(field)}
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 text-left font-mono text-[10px] text-white/30",
                      field && "cursor-pointer select-none hover:text-white/60"
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {field && (
                        sort.field === field ? (
                          sort.dir === "asc" ? <ArrowUp size={9} /> : <ArrowDown size={9} />
                        ) : (
                          <ArrowUpDown size={9} className="opacity-30" />
                        )
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-16 text-center text-[12px] text-white/20">
                    No trades match the current filters
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="group border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-white/40">{t.date}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[12px] font-medium">{t.pair}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        "rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase",
                        t.type === "buy"
                          ? "border-[#00d68f33] bg-[#00d68f10] text-[#00d68f]"
                          : "border-[#ff4d6a33] bg-[#ff4d6a10] text-[#ff4d6a]"
                      )}>
                        {t.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-white/60">{t.entryPrice}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-white/60">{t.exitPrice}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-white/50">{t.lotSize}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-[#ff4d6a]/70">{t.stopLoss}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-[#00d68f]/70">{t.takeProfit}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-white/50">{t.riskPercent}%</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className={cn("font-mono text-[12px] font-semibold", t.pnl >= 0 ? "text-[#00d68f]" : "text-[#ff4d6a]")}>
                        {fmtPnl(t.pnl)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className={cn("font-mono text-[11px] font-medium", t.rrr >= 1.5 ? "text-[#a78bfa]" : t.rrr >= 1 ? "text-white/60" : "text-[#ff4d6a]")}>
                        {t.rrr.toFixed(2)}R
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-full border border-white/[0.09] bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/40">
                        {t.session}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {t.tag && (
                        <span className="rounded-full border border-[#f5c51833] bg-[#f5c51815] px-2 py-0.5 font-mono text-[9px] text-[#f5c518]">
                          {t.tag}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-2.5 text-[11px] text-white/30">
                      {t.notes || "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {confirmDelete === t.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { deleteTrade(t.id); setConfirmDelete(null); }}
                            className="rounded px-2 py-0.5 text-[10px] text-[#ff4d6a] hover:bg-[#ff4d6a15] transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="rounded px-2 py-0.5 text-[10px] text-white/30 hover:text-white/60 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingTrade(t)}
                            title="Edit trade"
                            className="rounded p-1 text-white/0 transition-all group-hover:text-white/25 hover:!text-[#a78bfa]"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(t.id)}
                            title="Delete trade"
                            className="rounded p-1 text-white/0 transition-all group-hover:text-white/25 hover:!text-[#ff4d6a]"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTrade && (
        <LogTradeModal
          trade={editingTrade}
          onClose={() => setEditingTrade(null)}
        />
      )}
    </div>
  );
}

function FilterSelect({
  value, onChange, placeholder, options, labels,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
  labels?: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-[32px] rounded-lg border border-white/[0.09] bg-[#111118] px-2.5 font-mono text-[11px] outline-none transition-colors",
        "hover:border-white/20 focus:border-[#7c6af7]/60",
        value ? "text-white/80" : "text-white/30"
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((o, i) => (
        <option key={o} value={o}>{labels?.[i] ?? o}</option>
      ))}
    </select>
  );
}
