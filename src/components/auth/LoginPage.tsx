// src/components/auth/LoginPage.tsx
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { Zap, TrendingUp, BarChart3, Calendar } from "lucide-react";

export function LoginPage() {
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Sign-in failed", err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#7c6af7]/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#00d68f]/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] px-6">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c6af7] to-[#a78bfa] shadow-lg">
            <Zap size={24} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-[24px] font-semibold tracking-tight text-[#e8e8f0]">TradeLedger</h1>
            <p className="mt-1 text-[13px] text-white/40">Prop firm trading journal</p>
          </div>
        </div>

        {/* Features */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[
            { icon: Calendar, label: "Calendar heatmap" },
            { icon: BarChart3, label: "Deep analytics" },
            { icon: TrendingUp, label: "Multi-account" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-[#111118] p-3">
              <Icon size={18} className="text-[#7c6af7]" />
              <span className="text-center text-[10px] text-white/40">{label}</span>
            </div>
          ))}
        </div>

        {/* Sign in card */}
        <div className="rounded-2xl border border-white/[0.09] bg-[#111118] p-6">
          <h2 className="mb-2 text-[15px] font-semibold">Get started</h2>
          <p className="mb-6 text-[12px] text-white/40">
            Sign in with Google to access your trading journal. Your data is private and secure.
          </p>
          <button
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.09] bg-white/5 py-3 text-[13px] font-medium text-[#e8e8f0] transition-all hover:bg-white/10 active:scale-[0.99]"
          >
            {/* Google SVG icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-white/20">
          By continuing you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
