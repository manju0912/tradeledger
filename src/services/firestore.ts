// src/services/firestore.ts
// ─────────────────────────────────────────────────────────────────────────────
// All Firestore read/write operations, typed and abstracted away from the UI.
// ─────────────────────────────────────────────────────────────────────────────
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  getDocs, query, where, orderBy, serverTimestamp, Timestamp,
  onSnapshot, type Unsubscribe,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { PropAccount, Trade, NewTrade } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────
function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date(v as string);
}

// ─── Accounts ─────────────────────────────────────────────────────────────
const accountsCol = (userId: string) =>
  collection(db, "users", userId, "accounts");

export async function getAccounts(userId: string): Promise<PropAccount[]> {
  const snap = await getDocs(
    query(accountsCol(userId), orderBy("createdAt", "desc"))
  );
  return Promise.all(
    snap.docs.map(async (d) => {
      const account = {
        id: d.id,
        ...(d.data() as Omit<PropAccount, "id">),
        createdAt: toDate(d.data().createdAt),
        updatedAt: toDate(d.data().updatedAt),
      };
      const trades = await getTrades(userId, account.id);
      const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);

      return {
        ...account,
        currentBalance: account.startingBalance + totalPnl,
      };
    })
  );
}

export async function createAccount(
  userId: string,
  data: Omit<PropAccount, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> {
  const docRef = await addDoc(accountsCol(userId), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateAccount(
  userId: string,
  accountId: string,
  data: Partial<PropAccount>
): Promise<void> {
  await updateDoc(doc(accountsCol(userId), accountId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAccount(userId: string, accountId: string): Promise<void> {
  await deleteDoc(doc(accountsCol(userId), accountId));
}

export async function recalculateAccountBalance(
  userId: string,
  accountId: string
): Promise<void> {
  const accountSnap = await getDoc(doc(accountsCol(userId), accountId));
  if (!accountSnap.exists()) return;

  const account = accountSnap.data() as PropAccount;
  const trades = await getTrades(userId, accountId);
  const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);

  await updateAccount(userId, accountId, {
    currentBalance: account.startingBalance + totalPnl,
  });
}

// ─── Trades ───────────────────────────────────────────────────────────────
const tradesCol = (userId: string) =>
  collection(db, "users", userId, "trades");

export async function getTrades(
  userId: string,
  accountId: string
): Promise<Trade[]> {
  const snap = await getDocs(
    query(
      tradesCol(userId),
      where("accountId", "==", accountId)
    )
  );
  return snap.docs
    .map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Trade, "id">),
      createdAt: toDate(d.data().createdAt),
      updatedAt: toDate(d.data().updatedAt),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function subscribeToTrades(
  userId: string,
  accountId: string,
  callback: (trades: Trade[]) => void
): Unsubscribe {
  return onSnapshot(
    query(
      tradesCol(userId),
      where("accountId", "==", accountId)
    ),
    (snap) => {
      const trades = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Trade, "id">),
          createdAt: toDate(d.data().createdAt),
          updatedAt: toDate(d.data().updatedAt),
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
      callback(trades);
    }
  );
}

export async function createTrade(
  userId: string,
  trade: NewTrade
): Promise<string> {
  const docRef = await addDoc(tradesCol(userId), {
    ...trade,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTrade(
  userId: string,
  tradeId: string,
  data: Partial<Trade>
): Promise<void> {
  await updateDoc(doc(tradesCol(userId), tradeId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTrade(userId: string, tradeId: string): Promise<Trade | null> {
  const snap = await getDoc(doc(tradesCol(userId), tradeId));
  const trade = snap.exists()
    ? ({
        id: snap.id,
        ...(snap.data() as Omit<Trade, "id">),
        createdAt: toDate(snap.data().createdAt),
        updatedAt: toDate(snap.data().updatedAt),
      } satisfies Trade)
    : null;
  const imageUrl = snap.data()?.imageUrl as string | undefined;
  if (imageUrl) {
    try { await deleteObject(ref(storage, imageUrl)); } catch (_) { /* ignore */ }
  }
  await deleteDoc(doc(tradesCol(userId), tradeId));
  return trade;
}

// ─── Storage ──────────────────────────────────────────────────────────────
export async function uploadTradeScreenshot(
  userId: string,
  tradeId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `screenshots/${userId}/${tradeId}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
