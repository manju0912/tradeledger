// src/hooks/useTrades.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as fs from "@/services/firestore";
import { useStore } from "@/store";
import { calculateRRR } from "@/utils/calculations";
import type { Trade, NewTrade, PropAccount } from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────
export const KEYS = {
  accounts: (uid: string) => ["accounts", uid] as const,
  trades: (uid: string, accountId: string) => ["trades", uid, accountId] as const,
};

// ─── Accounts ─────────────────────────────────────────────────────────────
export function useAccounts() {
  const user = useStore((s) => s.user);
  const setAccounts = useStore((s) => s.setAccounts);
  const setActiveAccountId = useStore((s) => s.setActiveAccountId);
  const activeAccountId = useStore((s) => s.activeAccountId);

  return useQuery({
    queryKey: KEYS.accounts(user?.id ?? ""),
    queryFn: async () => {
      const accounts = await fs.getAccounts(user!.id);
      setAccounts(accounts);
      const activeAccountExists = accounts.some((account) => account.id === activeAccountId);
      if (accounts.length === 0) {
        setActiveAccountId(null);
      } else if (!activeAccountId || !activeAccountExists) {
        setActiveAccountId(accounts[0].id);
      }
      return accounts;
    },
    enabled: !!user,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  const user = useStore((s) => s.user);

  return useMutation({
    mutationFn: (data: Omit<PropAccount, "id" | "userId" | "createdAt" | "updatedAt">) =>
      fs.createAccount(user!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.accounts(user!.id) });
      toast.success("Account created!");
    },
    onError: () => toast.error("Failed to create account"),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  const user = useStore((s) => s.user);

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<PropAccount>;
    }) => {
      if (!user) throw new Error("You must be signed in to update an account.");
      await fs.updateAccount(user.id, id, data);
      await fs.recalculateAccountBalance(user.id, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.accounts(user!.id) });
      toast.success("Account updated");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to update account:", error);
      toast.error(`Failed to update account: ${message}`);
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  const user = useStore((s) => s.user);

  return useMutation({
    mutationFn: (accountId: string) => fs.deleteAccount(user!.id, accountId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.accounts(user!.id) });
      toast.success("Account removed");
    },
  });
}

// ─── Trades ───────────────────────────────────────────────────────────────
export function useTrades() {
  const user = useStore((s) => s.user);
  const accountId = useStore((s) => s.activeAccountId);
  const setTrades = useStore((s) => s.setTrades);

  return useQuery({
    queryKey: KEYS.trades(user?.id ?? "", accountId ?? ""),
    queryFn: async () => {
      const trades = await fs.getTrades(user!.id, accountId!);
      setTrades(trades);
      return trades;
    },
    enabled: !!user && !!accountId,
  });
}

export function useCreateTrade() {
  const qc = useQueryClient();
  const user = useStore((s) => s.user);
  const accountId = useStore((s) => s.activeAccountId);

  return useMutation({
    mutationFn: async ({
      trade,
      screenshotFile,
    }: {
      trade: Omit<NewTrade, "rrr">;
      screenshotFile?: File;
    }) => {
      if (!user) throw new Error("You must be signed in to log a trade.");
      if (!trade.accountId) throw new Error("Select an account before logging a trade.");

      const rrr = calculateRRR(
        trade.type,
        trade.entryPrice,
        trade.stopLoss,
        trade.takeProfit
      );
      // Create trade first to get the ID
      const id = await fs.createTrade(user.id, { ...trade, userId: user.id, rrr });
      // Upload screenshot if provided
      if (screenshotFile) {
        const url = await fs.uploadTradeScreenshot(user.id, id, screenshotFile);
        await fs.updateTrade(user.id, id, { imageUrl: url });
      }
      await fs.recalculateAccountBalance(user.id, trade.accountId);
      return { id, tradeAccountId: trade.accountId };
    },
    onSuccess: ({ tradeAccountId }) => {
      qc.invalidateQueries({ queryKey: KEYS.trades(user!.id, tradeAccountId) });
      if (accountId && accountId !== tradeAccountId) {
        qc.invalidateQueries({ queryKey: KEYS.trades(user!.id, accountId) });
      }
      qc.invalidateQueries({ queryKey: KEYS.accounts(user!.id) });
      toast.success("Trade logged!");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to log trade:", error);
      toast.error(`Failed to log trade: ${message}`);
    },
  });
}

export function useUpdateTrade() {
  const qc = useQueryClient();
  const user = useStore((s) => s.user);
  const accountId = useStore((s) => s.activeAccountId);

  return useMutation({
    mutationFn: async ({
      id,
      previousAccountId,
      data,
      screenshotFile,
    }: {
      id: string;
      previousAccountId: string;
      data: Partial<Trade>;
      screenshotFile?: File;
    }) => {
      if (!user) throw new Error("You must be signed in to update a trade.");
      const nextAccountId = data.accountId ?? previousAccountId;

      let imageUrl = data.imageUrl;
      if (screenshotFile) {
        imageUrl = await fs.uploadTradeScreenshot(user.id, id, screenshotFile);
      }

      await fs.updateTrade(user.id, id, {
        ...data,
        ...(imageUrl ? { imageUrl } : {}),
      });
      await fs.recalculateAccountBalance(user.id, previousAccountId);
      if (nextAccountId !== previousAccountId) {
        await fs.recalculateAccountBalance(user.id, nextAccountId);
      }
      return { previousAccountId, nextAccountId };
    },
    onSuccess: ({ previousAccountId, nextAccountId }) => {
      qc.invalidateQueries({ queryKey: KEYS.trades(user!.id, previousAccountId) });
      qc.invalidateQueries({ queryKey: KEYS.trades(user!.id, nextAccountId) });
      if (accountId && accountId !== previousAccountId && accountId !== nextAccountId) {
        qc.invalidateQueries({ queryKey: KEYS.trades(user!.id, accountId) });
      }
      qc.invalidateQueries({ queryKey: KEYS.accounts(user!.id) });
      toast.success("Trade updated");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to update trade:", error);
      toast.error(`Failed to update trade: ${message}`);
    },
  });
}

export function useDeleteTrade() {
  const qc = useQueryClient();
  const user = useStore((s) => s.user);
  const accountId = useStore((s) => s.activeAccountId);

  return useMutation({
    mutationFn: async (tradeId: string) => {
      if (!user) throw new Error("You must be signed in to delete a trade.");
      const deletedTrade = await fs.deleteTrade(user.id, tradeId);
      if (deletedTrade) {
        await fs.recalculateAccountBalance(user.id, deletedTrade.accountId);
      }
      return { tradeAccountId: deletedTrade?.accountId ?? accountId };
    },
    onSuccess: ({ tradeAccountId }) => {
      if (tradeAccountId) {
        qc.invalidateQueries({ queryKey: KEYS.trades(user!.id, tradeAccountId) });
      }
      qc.invalidateQueries({ queryKey: KEYS.accounts(user!.id) });
      toast.success("Trade deleted");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to delete trade:", error);
      toast.error(`Failed to delete trade: ${message}`);
    },
  });
}
