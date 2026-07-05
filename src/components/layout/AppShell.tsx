// src/components/layout/AppShell.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Root layout: sidebar + top bar + scrollable content area.
// ─────────────────────────────────────────────────────────────────────────────
import { Suspense, lazy } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useStore } from "@/store";

// Lazy-load each view for code splitting
const Dashboard = lazy(() => import("@/components/dashboard/Dashboard"));
const CalendarView = lazy(() => import("@/components/calendar/CalendarView"));
const TradeTable = lazy(() => import("@/components/table/TradeTable"));
const ScreenshotGrid = lazy(() => import("@/components/grid/ScreenshotGrid"));
const Analytics = lazy(() => import("@/components/analytics/Analytics"));
const Accounts = lazy(() => import("@/components/accounts/Accounts"));

const VIEW_MAP = {
  dashboard: Dashboard,
  calendar: CalendarView,
  table: TradeTable,
  grid: ScreenshotGrid,
  analytics: Analytics,
  accounts: Accounts,
} as const;

export function AppShell() {
  const activeView = useStore((s) => s.activeView);
  const ActiveView = VIEW_MAP[activeView];

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f] text-[#e8e8f0]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7c6af7] border-t-transparent" />
              </div>
            }
          >
            <ActiveView />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
