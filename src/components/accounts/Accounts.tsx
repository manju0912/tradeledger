// src/components/accounts/Accounts.tsx
import { useState } from "react";
import { Plus, Trash2, Building2, Target, X, CheckCircle2, AlertTriangle, XCircle, Edit3 } from "lucide-react";
import { useStore } from "@/store";
import { useAccounts, useCreateAccount, useDeleteAccount, useUpdateAccount } from "@/hooks/useTrades";
import { cn } from "@/utils/cn";
import { PHASES, type PropAccount, type Phase } from "@/types";

const PROP_FIRMS = [
  "FundedNext", "FTMO", "Goat Funded Trader", "Alpha Capital Group", "Funding Pips", "E8 Funding", "The 5ers", "For Traders", "MyForexFunds", "The Funded Trader",
  "Apex Trader Funding", "Topstep", "Blue Guardian", "Cointract", "Other",
];

type NewAccountForm = {
  name: string; propFirm: string; accountSize: number;
  currentBalance: number; startingBalance: number;
  dailyLossLimit: number; maxDrawdown: number;
  profitTarget: number; phase: Phase;
};

const DEFAULT_FORM: NewAccountForm = {
  name: "", propFirm: "FTMO", accountSize: 100000,
  currentBalance: 100000, startingBalance: 100000,
  dailyLossLimit: 500, maxDrawdown: 10,
  profitTarget: 10, phase: "Challenge",
};

function accountToForm(account: PropAccount): NewAccountForm {
  return {
    name: account.name,
    propFirm: account.propFirm,
    accountSize: account.accountSize,
    currentBalance: account.currentBalance,
    startingBalance: account.startingBalance,
    dailyLossLimit: account.dailyLossLimit,
    maxDrawdown: account.maxDrawdown,
    profitTarget: account.profitTarget,
    phase: account.phase,
  };
}

export default function Accounts() {
  useAccounts();

  const { accounts, activeAccountId, setActiveAccountId } = useStore();
  const { mutate: createAccount, isPending } = useCreateAccount();
  const { mutate: updateAccount, isPending: isUpdating } = useUpdateAccount();
  const { mutate: deleteAccount } = useDeleteAccount();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewAccountForm>(DEFAULT_FORM);
  const [editingAccount, setEditingAccount] = useState<PropAccount | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const set = (key: keyof NewAccountForm, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setAccountSize = (accountSize: number) =>
    setForm((prev) => ({
      ...prev,
      accountSize,
      startingBalance: editingAccount ? prev.startingBalance : accountSize,
      currentBalance: editingAccount ? prev.currentBalance : accountSize,
    }));

  const openCreateForm = () => {
    setEditingAccount(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  };

  const openEditForm = (account: PropAccount) => {
    setEditingAccount(account);
    setForm(accountToForm(account));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAccount(null);
    setForm(DEFAULT_FORM);
  };

  const handleSave = () => {
    if (editingAccount) {
      updateAccount(
        {
          id: editingAccount.id,
          data: form,
        },
        { onSuccess: closeForm }
      );
      return;
    }

    createAccount(
      { ...form, currentBalance: form.startingBalance, isActive: true },
      {
        onSuccess: closeForm,
      }
    );
  };

  return (
    <div className="p-5">
      {/* Header row */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] text-white/30">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""} connected
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-1.5 rounded-lg bg-[#7c6af7] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#9580ff] transition-colors"
        >
          <Plus size={14} /> Add Account
        </button>
      </div>

      {/* Accounts grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acct) => (
          <AccountCard
            key={acct.id}
            account={acct}
            isActive={acct.id === activeAccountId}
            onSelect={() => setActiveAccountId(acct.id)}
            onEdit={() => openEditForm(acct)}
            onDelete={() => setConfirmDelete(acct.id)}
            confirmingDelete={confirmDelete === acct.id}
            onConfirmDelete={() => { deleteAccount(acct.id); setConfirmDelete(null); }}
            onCancelDelete={() => setConfirmDelete(null)}
          />
        ))}

        {accounts.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.09] py-20 text-white/20">
            <Building2 size={32} />
            <p className="text-[13px]">No prop firm accounts yet</p>
            <p className="text-[11px]">Click "Add Account" to track your first challenge</p>
          </div>
        )}
      </div>

      {/* ── Add Account Modal ──────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.09] bg-[#111118] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">{editingAccount ? "Edit Prop Firm Account" : "Add Prop Firm Account"}</h2>
              <button onClick={closeForm} className="rounded-lg border border-white/[0.09] p-1.5 text-white/40 hover:text-white/80">
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="ACCOUNT NAME" full>
                <input className="form-input" placeholder="FTMO Challenge #1" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </FormField>
              <FormField label="PROP FIRM">
                <select className="form-input" value={form.propFirm} onChange={(e) => set("propFirm", e.target.value)}>
                  {PROP_FIRMS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </FormField>
              <FormField label="PHASE">
                <select className="form-input" value={form.phase} onChange={(e) => set("phase", e.target.value as Phase)}>
                  {PHASES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </FormField>
              <FormField label="ACCOUNT SIZE ($)">
                <input className="form-input" type="number" value={form.accountSize} onChange={(e) => setAccountSize(+e.target.value)} />
              </FormField>
              <FormField label="STARTING BALANCE ($)">
                <input className="form-input" type="number" value={form.startingBalance} onChange={(e) => set("startingBalance", +e.target.value)} />
              </FormField>
              <FormField label="DAILY LOSS LIMIT ($)">
                <input className="form-input" type="number" value={form.dailyLossLimit} onChange={(e) => set("dailyLossLimit", +e.target.value)} />
              </FormField>
              <FormField label="MAX DRAWDOWN (%)">
                <input className="form-input" type="number" value={form.maxDrawdown} onChange={(e) => set("maxDrawdown", +e.target.value)} />
              </FormField>
              <FormField label="PROFIT TARGET (%)">
                <input className="form-input" type="number" value={form.profitTarget} onChange={(e) => set("profitTarget", +e.target.value)} />
              </FormField>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={closeForm} className="rounded-lg border border-white/[0.09] px-4 py-2 text-[12px] text-white/50 hover:text-white/80">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name || isPending || isUpdating}
                className="rounded-lg bg-[#7c6af7] px-5 py-2 text-[12px] font-medium text-white hover:bg-[#9580ff] disabled:opacity-50 transition-colors"
              >
                {isPending || isUpdating ? "Saving…" : editingAccount ? "Update Account" : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountCard({
  account, isActive, onSelect, onEdit, onDelete,
  confirmingDelete, onConfirmDelete, onCancelDelete,
}: {
  account: PropAccount;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  confirmingDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  const pnl = account.currentBalance - account.startingBalance;
  const pnlPct = (pnl / account.startingBalance) * 100;
  const ddUsed = Math.abs(Math.min(0, pnlPct));
  const ddPct = Math.min(100, (ddUsed / account.maxDrawdown) * 100);
  const profitPct = Math.min(100, (Math.max(0, pnlPct) / account.profitTarget) * 100);

  const ddStatus = ddPct >= 90 ? "danger" : ddPct >= 60 ? "warning" : "safe";

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-[#111118] p-4 transition-all cursor-pointer",
        isActive
          ? "border-[#7c6af7]/50 shadow-[0_0_0_1px_#7c6af720]"
          : "border-white/[0.06] hover:border-white/[0.12]"
      )}
      onClick={onSelect}
    >
      {isActive && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#7c6af720] px-2 py-0.5">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a78bfa]" />
          <span className="font-mono text-[9px] text-[#a78bfa]">ACTIVE</span>
        </div>
      )}

      {/* Firm & Name */}
      <div className="mb-3 flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#16161f] text-[#7c6af7]">
          <Building2 size={16} />
        </div>
        <div>
          <p className="text-[13px] font-semibold leading-tight">{account.name}</p>
          <p className="font-mono text-[10px] text-white/30">{account.propFirm}</p>
        </div>
        <span className={cn(
          "ml-auto shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] font-medium",
          account.phase === "Funded"
            ? "border-[#00d68f33] bg-[#00d68f15] text-[#00d68f]"
            : "border-[#f5c51833] bg-[#f5c51815] text-[#f5c518]"
        )}>
          {account.phase.toUpperCase()}
        </span>
      </div>

      {/* Balance */}
      <div className="mb-3 flex items-baseline gap-1.5">
        <span className={cn("font-mono text-[20px] font-semibold", pnl >= 0 ? "text-[#00d68f]" : "text-[#ff4d6a]")}>
          {pnl >= 0 ? "+" : ""}${pnl.toLocaleString()}
        </span>
        <span className={cn("font-mono text-[11px]", pnl >= 0 ? "text-[#00d68f]/60" : "text-[#ff4d6a]/60")}>
          ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)
        </span>
      </div>

      {/* Rule meters */}
      <div className="space-y-2.5 mb-3">
        {/* Drawdown */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1 font-mono text-[10px] text-white/40">
              {ddStatus === "safe" && <CheckCircle2 size={10} className="text-[#00d68f]" />}
              {ddStatus === "warning" && <AlertTriangle size={10} className="text-[#f5c518]" />}
              {ddStatus === "danger" && <XCircle size={10} className="text-[#ff4d6a]" />}
              DD Used
            </span>
            <span className={cn(
              "font-mono text-[10px]",
              ddStatus === "safe" ? "text-white/40" : ddStatus === "warning" ? "text-[#f5c518]" : "text-[#ff4d6a]"
            )}>
              {ddUsed.toFixed(1)}% / {account.maxDrawdown}%
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${ddPct}%`,
                background: ddStatus === "safe" ? "#00d68f" : ddStatus === "warning" ? "#f5c518" : "#ff4d6a",
              }}
            />
          </div>
        </div>

        {/* Profit target */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1 font-mono text-[10px] text-white/40">
              <Target size={10} className="text-[#a78bfa]" />
              Profit Target
            </span>
            <span className="font-mono text-[10px] text-[#a78bfa]">
              {Math.max(0, pnlPct).toFixed(1)}% / {account.profitTarget}%
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-[#7c6af7] transition-all" style={{ width: `${profitPct}%` }} />
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Size", val: `$${(account.accountSize / 1000).toFixed(0)}K` },
          { label: "Balance", val: `$${account.currentBalance.toLocaleString()}` },
          { label: "Daily Limit", val: `-$${account.dailyLossLimit.toLocaleString()}`, danger: true },
          { label: "Max DD", val: `${account.maxDrawdown}%`, danger: true },
        ].map(({ label, val, danger }) => (
          <div key={label} className="rounded-lg border border-white/[0.04] bg-[#16161f] px-2.5 py-1.5">
            <p className="font-mono text-[9px] text-white/25">{label}</p>
            <p className={cn("font-mono text-[11px] font-medium mt-0.5", danger ? "text-[#ff4d6a]/80" : "text-white/60")}>
              {val}
            </p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-3 border-t border-white/[0.04] pt-3" onClick={(e) => e.stopPropagation()}>
        {confirmingDelete ? (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#ff4d6a]">Delete this account?</span>
            <div className="flex gap-2">
              <button onClick={onCancelDelete} className="text-[11px] text-white/40 hover:text-white/70">Cancel</button>
              <button onClick={onConfirmDelete} className="text-[11px] text-[#ff4d6a] hover:text-[#ff6b80]">Delete</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 text-[11px] text-white/25 hover:text-[#a78bfa] transition-colors"
            >
              <Edit3 size={11} /> Edit account
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 text-[11px] text-white/20 hover:text-[#ff4d6a] transition-colors"
            >
              <Trash2 size={11} /> Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({
  label, children, full,
}: {
  label: string; children: React.ReactNode; full?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1", full && "col-span-2")}>
      <label className="font-mono text-[10px] text-white/30">{label}</label>
      {children}
    </div>
  );
}
