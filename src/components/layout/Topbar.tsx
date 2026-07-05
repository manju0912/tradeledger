// src/components/layout/Topbar.tsx
import { useState } from "react";
import { Plus, Download, Flame, Building2, Check, ChevronDown } from "lucide-react";
import { useStore } from "@/store";
import { useAccounts } from "@/hooks/useTrades";
import { exportToCsv } from "@/utils/calculations";
import { LogTradeModal } from "@/components/modals/LogTradeModal";

const VIEW_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  calendar: "Performance Calendar",
  table: "Trade Log",
  grid: "Screenshot Journal",
  analytics: "Analytics",
  accounts: "Account Management",
};

export function Topbar() {
  useAccounts();
  const [showModal, setShowModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const { activeView, trades, accounts, activeAccountId, setActiveAccountId } = useStore();
  const activeAccount = accounts.find((account) => account.id === activeAccountId);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-[52px] items-center gap-3 border-b border-white/[0.06] bg-[#0a0a0f] px-5">
        <h1 className="text-[15px] font-semibold tracking-tight">
          {VIEW_TITLES[activeView] ?? activeView}
        </h1>

        <div className="ml-auto flex items-center gap-2">
          {accounts.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowAccountMenu((open) => !open)}
                className="flex h-[32px] min-w-[180px] items-center gap-2 rounded-lg border border-white/[0.09] bg-[#111118] px-2.5 text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
              >
                <Building2 size={13} className="shrink-0 text-[#a78bfa]" />
                <span className="max-w-[150px] truncate text-left font-mono text-[11px] text-white/70">
                  {activeAccount?.name ?? "Select account"}
                </span>
                <ChevronDown size={12} className="ml-auto shrink-0 text-white/30" />
              </button>

              {showAccountMenu && (
                <div className="absolute right-0 top-[38px] z-50 w-[240px] overflow-hidden rounded-lg border border-white/[0.09] bg-[#16161f] py-1 shadow-xl shadow-black/40">
                  {accounts.map((account) => {
                    const selected = account.id === activeAccountId;

                    return (
                      <button
                        key={account.id}
                        onClick={() => {
                          setActiveAccountId(account.id);
                          setShowAccountMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white/[0.04]"
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[#a78bfa]">
                          {selected && <Check size={13} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-medium text-white/80">{account.name}</span>
                          <span className="block truncate font-mono text-[9px] text-white/30">
                            {account.propFirm} · ${(account.accountSize / 1000).toFixed(0)}K
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Streak badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-[#f5c51833] bg-[#f5c51815] px-3 py-1">
            <Flame size={12} className="text-[#f5c518]" />
            <span className="font-mono text-[10px] font-medium text-[#f5c518]">7 day streak</span>
          </div>

          <button
            onClick={() => exportToCsv(trades)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.09] px-3 py-1.5 text-[12px] text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
          >
            <Download size={13} />
            Export CSV
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#7c6af7] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#9580ff]"
          >
            <Plus size={14} />
            Log Trade
          </button>
        </div>
      </header>

      {showModal && <LogTradeModal onClose={() => setShowModal(false)} />}
    </>
  );
}
