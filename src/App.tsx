// src/App.tsx
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { Toaster } from "react-hot-toast";
import { auth } from "@/lib/firebase";
import { useStore } from "@/store";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/components/auth/LoginPage";
import type { User } from "@/types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function AuthGate() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          displayName: firebaseUser.displayName ?? "Trader",
          photoURL: firebaseUser.photoURL ?? undefined,
          createdAt: new Date(firebaseUser.metadata.creationTime ?? Date.now()),
        });
      } else {
        setUser(null);
      }
    });
    return unsub;
  }, [setUser]);

  if (!user) return <LoginPage />;
  return <AppShell />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#16161f",
            color: "#e8e8f0",
            border: "1px solid #ffffff18",
            borderRadius: "10px",
            fontSize: "13px",
          },
          success: { iconTheme: { primary: "#00d68f", secondary: "#16161f" } },
          error: { iconTheme: { primary: "#ff4d6a", secondary: "#16161f" } },
        }}
      />
    </QueryClientProvider>
  );
}
