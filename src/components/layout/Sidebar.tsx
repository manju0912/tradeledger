// src/components/layout/Sidebar.tsx
import {
  LayoutDashboard, Calendar, Table2, LayoutGrid,
  LineChart, Building2, LogOut, ChevronsLeft, Zap,
} from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import type { ViewTab } from "@/types";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface NavItem {
  icon: React.ElementType;
  label: string;
  view: ViewTab;
  dot?: boolean;
}

const NAV_ITEMS: { section: string; items: NavItem[] }[] = [
  {
    section: "OVERVIEW",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", view: "dashboard", dot: true },
      { icon: Calendar, label: "Calendar", view: "calendar" },
    ],
  },
  {
    section: "JOURNAL",
    items: [
      { icon: Table2, label: "Trade Log", view: "table" },
      { icon: LayoutGrid, label: "Screenshots", view: "grid" },
    ],
  },
  {
    section: "ANALYSIS",
    items: [
      { icon: LineChart, label: "Analytics", view: "analytics" },
      { icon: Building2, label: "Accounts", view: "accounts" },
    ],
  },
];

export function Sidebar() {
  const { activeView, setActiveView, user, accounts, activeAccountId, setActiveAccountId, sidebarCollapsed, toggleSidebar } = useStore();
  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-white/[0.06] bg-[#111118] transition-all duration-200",
        sidebarCollapsed ? "w-[56px]" : "w-[220px] min-w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-[52px] items-center gap-3 border-b border-white/[0.06] px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6af7] to-[#a78bfa] text-sm font-semibold text-white">
          <Zap size={14} />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <div className="text-[15px] font-semibold tracking-tight">TradeLedger</div>
            <div className="font-mono text-[10px] text-white/30">Prop Journal v1.0</div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto rounded p-1 text-white/30 hover:bg-white/5 hover:text-white/60"
        >
          <ChevronsLeft size={14} className={cn("transition-transform", sidebarCollapsed && "rotate-180")} />
        </button>
      </div>

      {/* Account Switcher */}
      {!sidebarCollapsed && activeAccount && (
        <div className="mx-2 mt-3 cursor-pointer rounded-lg border border-white/[0.09] bg-[#16161f] p-2 hover:border-white/[0.14] transition-colors">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="truncate text-[12px] font-medium">{activeAccount.name}</div>
              <div className="font-mono text-[10px] text-white/30">
                {activeAccount.propFirm} · ${(activeAccount.accountSize / 1000).toFixed(0)}K
              </div>
            </div>
            <span className={cn(
              "rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-medium",
              activeAccount.phase === "Funded"
                ? "border-[#00d68f33] bg-[#00d68f15] text-[#00d68f]"
                : "border-[#f5c51833] bg-[#f5c51815] text-[#f5c518]"
            )}>
              {activeAccount.phase.toUpperCase()}
            </span>
          </div>
          {/* Account quick-switch */}
          {accounts.length > 1 && (
            <div className="mt-2 flex gap-1">
              {accounts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setActiveAccountId(a.id)}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    a.id === activeAccountId ? "bg-[#7c6af7]" : "bg-white/10 hover:bg-white/20"
                  )}
                  title={a.name}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map(({ section, items }) => (
          <div key={section}>
            {!sidebarCollapsed && (
              <div className="px-4 pb-1 pt-3 font-mono text-[9px] font-medium tracking-[1.2px] text-white/25">
                {section}
              </div>
            )}
            {items.map(({ icon: Icon, label, view, dot }) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md border border-transparent px-3 py-[7px] text-[12px] font-normal text-white/50 transition-all",
                  "mx-1.5 my-[1px] hover:bg-[#16161f] hover:text-white/90",
                  activeView === view && "border-white/[0.09] bg-[#1c1c28] text-[#a78bfa]"
                )}
                style={{ width: "calc(100% - 12px)" }}
              >
                <Icon size={15} className="shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span>{label}</span>
                    {dot && (
                      <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-[#00d68f]" />
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/[0.06] p-2">
        <div className="flex items-center gap-2 rounded-lg p-2 hover:bg-white/5 cursor-pointer group">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="h-7 w-7 shrink-0 rounded-full" />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7c6af7] to-[#a78bfa] font-semibold text-[11px] text-white">
              {user?.displayName?.slice(0, 2).toUpperCase() ?? "??"}
            </div>
          )}
          {!sidebarCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium">{user?.displayName}</div>
                <div className="truncate text-[10px] text-white/30">{user?.email}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/70 transition-opacity"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
