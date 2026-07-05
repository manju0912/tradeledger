// src/components/modals/LogTradeModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Full trade logging form with auto-calculated RRR and image upload.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { X, ImagePlus, Calculator } from "lucide-react";
import { useAccounts, useCreateTrade, useUpdateTrade } from "@/hooks/useTrades";
import { useStore } from "@/store";
import { calculateRRR } from "@/utils/calculations";
import { cn } from "@/utils/cn";
import type { Trade, TradeType, Session, TradeTag } from "@/types";

interface LogTradeModalProps {
  onClose: () => void;
  trade?: Trade;
}

const PAIRS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "US30", "NAS100", "USOIL", "BTCUSD", "SPX500", "Other"];
const SESSIONS: Session[] = ["London", "New York", "Asian", "Pre-Market", "Other"];
const TAGS: TradeTag[] = ["", "A+ Setup", "B Setup", "Revenge Trade", "News Play", "FOMO", "Scalp"];

interface FormState {
  date: string;
  pair: string;
  type: TradeType;
  entryPrice: string;
  exitPrice: string;
  lotSize: string;
  stopLoss: string;
  takeProfit: string;
  riskPercent: string;
  pnl: string;
  session: Session;
  tag: TradeTag;
  notes: string;
}

const initState: FormState = {
  date: new Date().toISOString().slice(0, 10),
  pair: "XAUUSD",
  type: "buy",
  entryPrice: "",
  exitPrice: "",
  lotSize: "",
  stopLoss: "",
  takeProfit: "",
  riskPercent: "1",
  pnl: "",
  session: "London",
  tag: "",
  notes: "",
};

function tradeToForm(trade: Trade): FormState {
  return {
    date: trade.date,
    pair: trade.pair,
    type: trade.type,
    entryPrice: String(trade.entryPrice),
    exitPrice: String(trade.exitPrice),
    lotSize: String(trade.lotSize),
    stopLoss: String(trade.stopLoss),
    takeProfit: String(trade.takeProfit),
    riskPercent: String(trade.riskPercent),
    pnl: String(trade.pnl),
    session: trade.session,
    tag: trade.tag,
    notes: trade.notes,
  };
}

export function LogTradeModal({ onClose, trade }: LogTradeModalProps) {
  useAccounts();
  const isEditing = !!trade;
  const [form, setForm] = useState<FormState>(() => trade ? tradeToForm(trade) : initState);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(trade?.imageUrl ?? null);
  const accountId = useStore((s) => s.activeAccountId)!;
  const setActiveAccountId = useStore((s) => s.setActiveAccountId);
  const accounts = useStore((s) => s.accounts);
  const userId = useStore((s) => s.user!.id);
  const [selectedAccountId, setSelectedAccountId] = useState(
    trade?.accountId ?? accountId ?? accounts[0]?.id ?? ""
  );
  const { mutate: createTrade, isPending } = useCreateTrade();
  const { mutate: updateTrade, isPending: isUpdating } = useUpdateTrade();

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(trade?.accountId ?? accountId ?? accounts[0].id);
    }
  }, [accountId, accounts, selectedAccountId, trade?.accountId]);

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setScreenshot(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const computedRRR = (() => {
    const e = parseFloat(form.entryPrice);
    const sl = parseFloat(form.stopLoss);
    const tp = parseFloat(form.takeProfit);
    if (!e || !sl || !tp) return null;
    return calculateRRR(form.type, e, sl, tp);
  })();

  const handleSubmit = () => {
    const rrr = calculateRRR(
      form.type,
      parseFloat(form.entryPrice) || 0,
      parseFloat(form.stopLoss) || 0,
      parseFloat(form.takeProfit) || 0
    );
    const editableTradeData = {
      date: form.date,
      pair: form.pair,
      type: form.type,
      entryPrice: parseFloat(form.entryPrice) || 0,
      exitPrice: parseFloat(form.exitPrice) || 0,
      lotSize: parseFloat(form.lotSize) || 0,
      stopLoss: parseFloat(form.stopLoss) || 0,
      takeProfit: parseFloat(form.takeProfit) || 0,
      riskPercent: parseFloat(form.riskPercent) || 1,
      pnl: parseFloat(form.pnl) || 0,
      rrr,
      session: form.session,
      tag: form.tag,
      notes: form.notes,
    };
    const closeAfterSave = () => {
      setActiveAccountId(selectedAccountId);
      onClose();
    };

    if (trade) {
      updateTrade(
        {
          id: trade.id,
          previousAccountId: trade.accountId,
          data: {
            ...editableTradeData,
            accountId: selectedAccountId,
          },
          screenshotFile: screenshot ?? undefined,
        },
        { onSuccess: closeAfterSave }
      );
      return;
    }

    createTrade(
      {
        trade: {
          accountId: selectedAccountId,
          userId,
          ...editableTradeData,
        },
        screenshotFile: screenshot ?? undefined,
      },
      { onSuccess: closeAfterSave }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative mx-4 w-full max-w-[540px] max-h-[92vh] overflow-y-auto rounded-2xl border border-white/[0.09] bg-[#111118] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight">{isEditing ? "Edit Trade" : "Log New Trade"}</h2>
          <button onClick={onClose} className="rounded-lg border border-white/[0.09] p-1.5 text-white/40 hover:text-white/80">
            <X size={14} />
          </button>
        </div>

        {/* Buy / Sell toggle */}
        <div className="mb-4 flex rounded-lg border border-white/[0.09] p-1">
          {(["buy", "sell"] as TradeType[]).map((t) => (
            <button
              key={t}
              onClick={() => set("type", t)}
              className={cn(
                "flex-1 rounded-md py-1.5 text-[12px] font-medium capitalize transition-all",
                form.type === t
                  ? t === "buy"
                    ? "bg-[#00d68f20] text-[#00d68f]"
                    : "bg-[#ff4d6a20] text-[#ff4d6a]"
                  : "text-white/30 hover:text-white/60"
              )}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="ACCOUNT" full>
            <select
              className="form-input"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} · {account.propFirm}
                </option>
              ))}
            </select>
          </Field>

          <Field label="DATE" full>
            <input className="form-input" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </Field>

          <Field label="PAIR">
            <select className="form-input" value={form.pair} onChange={(e) => set("pair", e.target.value)}>
              {PAIRS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>

          <Field label="SESSION">
            <select className="form-input" value={form.session} onChange={(e) => set("session", e.target.value as Session)}>
              {SESSIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="ENTRY PRICE">
            <input className="form-input" type="number" step="any" placeholder="2310.50" value={form.entryPrice} onChange={(e) => set("entryPrice", e.target.value)} />
          </Field>

          <Field label="EXIT PRICE">
            <input className="form-input" type="number" step="any" placeholder="2325.00" value={form.exitPrice} onChange={(e) => set("exitPrice", e.target.value)} />
          </Field>

          <Field label="STOP LOSS">
            <input className="form-input" type="number" step="any" placeholder="2300.00" value={form.stopLoss} onChange={(e) => set("stopLoss", e.target.value)} />
          </Field>

          <Field label="TAKE PROFIT">
            <input className="form-input" type="number" step="any" placeholder="2340.00" value={form.takeProfit} onChange={(e) => set("takeProfit", e.target.value)} />
          </Field>

          <Field label="LOT SIZE">
            <input className="form-input" type="number" step="0.01" placeholder="0.50" value={form.lotSize} onChange={(e) => set("lotSize", e.target.value)} />
          </Field>

          <Field label="RISK %">
            <input className="form-input" type="number" step="0.1" placeholder="1.0" value={form.riskPercent} onChange={(e) => set("riskPercent", e.target.value)} />
          </Field>

          <Field label="P&L ($)">
            <input className="form-input" type="number" step="any" placeholder="350" value={form.pnl} onChange={(e) => set("pnl", e.target.value)} />
          </Field>

          <Field label="TAG">
            <select className="form-input" value={form.tag} onChange={(e) => set("tag", e.target.value as TradeTag)}>
              {TAGS.map((t) => <option key={t} value={t}>{t || "None"}</option>)}
            </select>
          </Field>
        </div>

        {/* Auto RRR display */}
        {computedRRR !== null && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.09] bg-[#16161f] px-3 py-2">
            <Calculator size={12} className="text-[#a78bfa]" />
            <span className="text-[11px] text-white/40">Calculated RRR:</span>
            <span className={cn("font-mono text-[12px] font-medium", computedRRR > 0 ? "text-[#a78bfa]" : "text-[#ff4d6a]")}>
              {computedRRR.toFixed(2)}R
            </span>
          </div>
        )}

        {/* Notes */}
        <div className="mt-3">
          <label className="mb-1 block font-mono text-[10px] text-white/30">NOTES</label>
          <textarea
            className="form-input w-full resize-none"
            rows={3}
            placeholder="Describe your setup, entry reason, post-trade analysis..."
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        {/* Screenshot drop zone */}
        <div className="mt-3">
          <label className="mb-1 block font-mono text-[10px] text-white/30">SCREENSHOT</label>
          {previewUrl ? (
            <div className="relative">
              <img src={previewUrl} alt="Screenshot preview" className="h-32 w-full rounded-lg object-cover" />
              <button
                onClick={() => { setScreenshot(null); setPreviewUrl(null); }}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white/70 hover:text-white"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={cn(
                "flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed transition-colors",
                isDragActive ? "border-[#7c6af7] bg-[#7c6af710]" : "border-white/[0.09] hover:border-white/20"
              )}
            >
              <input {...getInputProps()} />
              <ImagePlus size={18} className="text-white/20" />
              <span className="text-[11px] text-white/30">Drop screenshot or click to upload</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-lg border border-white/[0.09] px-4 py-2 text-[12px] text-white/50 hover:text-white/80">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedAccountId || isPending || isUpdating}
            className="flex items-center gap-2 rounded-lg bg-[#7c6af7] px-5 py-2 text-[12px] font-medium text-white hover:bg-[#9580ff] disabled:opacity-50"
          >
            {isPending || isUpdating ? "Saving..." : isEditing ? "Update Trade" : "Save Trade"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1", full && "col-span-2")}>
      <label className="font-mono text-[10px] text-white/30">{label}</label>
      {children}
    </div>
  );
}
