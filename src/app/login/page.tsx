"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, ChevronLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase-browser";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

type Mode = "login" | "signup" | "forgot";

function InputField({
  icon,
  type,
  placeholder,
  value,
  onChange,
  required,
  right,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 h-12 rounded-[10px] border-[1.5px] border-border bg-card transition-all duration-150 focus-within:border-primary focus-within:ring-3 focus-within:ring-accent">
      <span className="text-muted-foreground flex shrink-0">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="flex-1 bg-transparent border-none outline-none text-sm font-sans text-foreground h-full placeholder:text-muted-foreground"
      />
      {right}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [supabase] = useState(() => createClient());

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) {
    router.replace("/");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (signUpError) throw signUpError;
        router.push("/");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push("/");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/auth/callback` }
      );
      if (resetError) throw resetError;
      setForgotSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-background">
      {/* Branding */}
      <div className="flex flex-col items-center mb-9">
        <div className="flex items-center gap-2.5 mb-3">
          <GraduationCap className="h-7 w-7 text-primary" />
          <span className="font-heading text-[28px] font-bold text-foreground tracking-[-0.01em]">
            StudyDeck
          </span>
        </div>
        <p className="text-[15px] text-muted-foreground text-center leading-normal">
          Turn your materials into deep understanding.
        </p>
      </div>

      {/* Form container */}
      <div className="w-full max-w-[400px]">
        {/* Forgot password view */}
        {mode === "forgot" ? (
          <>
            <button
              onClick={() => { setMode("login"); setForgotSent(false); setError(null); }}
              className="flex items-center gap-1 text-[13px] text-muted-foreground mb-6 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Back to login
            </button>

            <h2 className="font-heading text-[22px] font-bold text-foreground mb-1.5">
              Reset your password
            </h2>
            <p className="text-sm text-muted-foreground leading-normal mb-7">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            {forgotSent ? (
              <div className="p-5 px-6 rounded-xl bg-[var(--success-surface)] border border-[var(--success-border)]">
                <p className="text-sm text-[var(--success)] font-medium leading-relaxed">
                  Check your inbox — we sent a reset link to <strong>{email || "your email"}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                {error && (
                  <p className="text-sm text-destructive mb-3">{error}</p>
                )}
                <InputField
                  icon={<Mail className="h-[18px] w-[18px]" />}
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={setEmail}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-[10px] bg-primary hover:bg-[var(--ring)] text-primary-foreground text-[15px] font-semibold transition-all duration-150 mt-2 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait"
                >
                  {loading && <Loader2 className="h-[18px] w-[18px] animate-spin" />}
                  Send reset link
                </button>
              </form>
            )}
          </>
        ) : (
          <>
            {/* Login / Signup header */}
            <div className="mb-7">
              <h2 className="font-heading text-[22px] font-bold text-foreground mb-1.5">
                {isSignup ? "Create your account" : "Welcome back"}
              </h2>
              <p className="text-sm text-muted-foreground leading-normal">
                {isSignup
                  ? "Start your journey to deeper learning."
                  : "Sign in to continue studying."}
              </p>
            </div>

            {/* Google login */}
            <div className="flex flex-col gap-2.5 mb-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2.5 w-full h-[46px] rounded-[10px] border-[1.5px] border-border bg-card hover:bg-[var(--surface-hover,var(--secondary))] text-foreground text-sm font-medium transition-all duration-150"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-[var(--text-tertiary,var(--muted-foreground))] font-mono uppercase tracking-[0.05em]">
                or
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive mb-3">{error}</p>
            )}

            {/* Email form */}
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3.5">
                {isSignup && (
                  <InputField
                    icon={<User className="h-[18px] w-[18px]" />}
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={setName}
                    required
                  />
                )}

                <InputField
                  icon={<Mail className="h-[18px] w-[18px]" />}
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={setEmail}
                  required
                />

                <InputField
                  icon={<Lock className="h-[18px] w-[18px]" />}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={setPassword}
                  required
                  right={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground flex p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="h-[18px] w-[18px]" />
                      ) : (
                        <Eye className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  }
                />
              </div>

              {/* Forgot password link */}
              {!isSignup && (
                <div className="flex justify-end mt-2.5">
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setError(null); }}
                    className="text-[13px] font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full h-12 rounded-[10px] bg-primary hover:bg-[var(--ring)] text-primary-foreground text-[15px] font-semibold transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait ${isSignup ? "mt-5" : "mt-3.5"}`}
              >
                {loading && <Loader2 className="h-[18px] w-[18px] animate-spin" />}
                {isSignup ? "Create account" : "Sign in"}
              </button>
            </form>

            {/* Toggle login/signup */}
            <p className="text-center text-sm text-muted-foreground mt-7">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => { setMode(isSignup ? "login" : "signup"); setError(null); }}
                className="text-primary font-semibold text-sm hover:underline"
              >
                {isSignup ? "Sign in" : "Sign up"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
