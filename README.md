# TradeLedger 📊

> A professional-grade trading journal for prop firm traders — built with React, TypeScript, Firebase, and Recharts.

![Dark Mode UI](https://placehold.co/1200x630/0a0a0f/7c6af7?text=TradeLedger)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🏦 **Multi-Account** | Track multiple prop firm accounts (FTMO, E8, MFF, etc.) with rule meters |
| 📅 **Calendar Heatmap** | Monthly P&L calendar with green/red day blocks, trade counts & drill-down |
| 📊 **Trade Log Table** | Sortable, filterable full trade table with RRR, sessions, tags |
| 🖼️ **Screenshot Grid** | Visual card journal with screenshot upload and modal detail |
| 📈 **Analytics** | Equity curve, daily P&L bars, win/loss donut, per-instrument breakdown |
| 🔐 **Google Auth** | One-click sign in — every user's data is fully private |
| 💾 **Real-time Sync** | Firestore real-time listeners — trades update instantly across tabs |
| 📤 **CSV Export** | One-click export of all trades to CSV |
| 🌙 **Dark Mode** | Beautiful dark UI as default — no light mode bloat |

---

## 🗂️ Folder Structure

```
tradeledger/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── accounts/
│   │   │   └── Accounts.tsx          ← Prop firm account cards + add modal
│   │   ├── analytics/
│   │   │   └── Analytics.tsx         ← Recharts: equity, daily P&L, win-rate, pairs
│   │   ├── auth/
│   │   │   └── LoginPage.tsx         ← Google OAuth sign-in page
│   │   ├── calendar/
│   │   │   └── CalendarView.tsx      ← Monthly heatmap calendar
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx         ← KPI strip + sparkline + mini calendar
│   │   ├── grid/
│   │   │   └── ScreenshotGrid.tsx    ← Visual card grid + detail modal
│   │   ├── layout/
│   │   │   ├── AppShell.tsx          ← Root layout with lazy-loaded views
│   │   │   ├── Sidebar.tsx           ← Navigation + account switcher
│   │   │   └── Topbar.tsx            ← Page title + Log Trade button
│   │   ├── modals/
│   │   │   └── LogTradeModal.tsx     ← Trade entry form with screenshot dropzone
│   │   └── table/
│   │       └── TradeTable.tsx        ← Full sortable/filterable trade log
│   ├── hooks/
│   │   └── useTrades.ts              ← React Query hooks: trades + accounts
│   ├── lib/
│   │   ├── firebase.ts               ← Firebase initialisation
│   │   └── seedData.ts               ← Demo data seeder for development
│   ├── services/
│   │   └── firestore.ts              ← All Firestore + Storage operations
│   ├── store/
│   │   └── index.ts                  ← Zustand global store
│   ├── types/
│   │   └── index.ts                  ← TypeScript interfaces & types
│   ├── utils/
│   │   ├── calculations.ts           ← Pure helpers: RRR, stats, CSV export
│   │   └── cn.ts                     ← Tailwind class merge utility
│   ├── App.tsx                       ← QueryClient + auth gate
│   ├── main.tsx                      ← React entry point
│   └── index.css                     ← Tailwind + global base styles
├── .env.example                      ← Firebase env vars template
├── firestore.rules                   ← Firestore security rules
├── storage.rules                     ← Firebase Storage security rules
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js ≥ 18
- A Firebase project ([create one free](https://console.firebase.google.com))

### 2. Clone & Install

```bash
git clone https://github.com/you/tradeledger.git
cd tradeledger
npm install
```

### 3. Firebase Setup

#### a) Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com) → **Add project**
2. Name it `tradeledger` → Continue

#### b) Enable Authentication

1. Left sidebar → **Authentication** → **Get started**
2. Sign-in method → **Google** → Enable → Save

#### c) Create Firestore Database

1. Left sidebar → **Firestore Database** → **Create database**
2. Choose **Production mode** → Select a region → Done

#### d) Enable Storage

1. Left sidebar → **Storage** → **Get started**
2. Accept defaults → Done

#### e) Get your config

1. Project Settings (⚙️) → **Your apps** → Web app → **Add app**
2. Copy the `firebaseConfig` object values

### 4. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and paste your Firebase values:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=myproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=myproject
VITE_FIREBASE_STORAGE_BUCKET=myproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 5. Deploy Security Rules

Install Firebase CLI if you haven't:

```bash
npm install -g firebase-tools
firebase login
firebase init   # select Firestore + Storage, link to your project
```

Deploy the rules:

```bash
firebase deploy --only firestore:rules,storage
```

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — sign in with Google and you're live!

---

## 🌱 Load Demo Data

After signing in and creating your first account, open the browser console and run:

```javascript
import { seedDemoData } from './src/lib/seedData';
// Replace with your actual userId and accountId from Firestore
await seedDemoData('YOUR_USER_ID', 'YOUR_ACCOUNT_ID');
```

This loads **16 realistic May 2025 trades** including XAUUSD, EURUSD, US30, NAS100, GBPUSD.

---

## 🏗️ Data Model (Firestore)

```
users/{userId}
  ├── accounts/{accountId}
  │     name, propFirm, accountSize, currentBalance, startingBalance,
  │     dailyLossLimit, maxDrawdown, profitTarget, phase, isActive
  │
  └── trades/{tradeId}
        accountId, date, pair, type, entryPrice, exitPrice,
        lotSize, stopLoss, takeProfit, riskPercent, pnl, rrr,
        session, tag, notes, imageUrl
```

---

## 📦 Build for Production

```bash
npm run build
# Output: dist/ directory, ready to deploy to Vercel / Netlify / Firebase Hosting
```

Deploy to Firebase Hosting:

```bash
firebase deploy --only hosting
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS v3 |
| State | Zustand (UI) + React Query (server) |
| Backend | Firebase (Auth + Firestore + Storage) |
| Charts | Recharts |
| Icons | Lucide React |
| File Upload | react-dropzone |
| Toasts | react-hot-toast |
| Date Utils | date-fns |

---

## 🔮 Roadmap / Bonus Features

- [ ] AI trade analysis (Anthropic API integration — describe the trade, get feedback)
- [ ] Daily journal notes (free-form text per trading day)
- [ ] Streak tracking badge
- [ ] Webhook import from MT4/MT5 or cTrader
- [ ] Mobile PWA support
- [ ] Trade tagging improvements (multi-tag)
- [ ] Dark/light theme toggle
- [ ] Supabase migration option (for users preferring PostgreSQL)

---

## 📄 License

MIT — use freely, attribute if you share.
