import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { ResendVerification } from "@/components/ResendVerification";
import { isEmailVerified, verificationRedirect } from "@/lib/email-verification";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — EasyLoan" },
      { name: "description", content: "Sign in or create your EasyLoan account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Sign in — EasyLoan" },
      { property: "og:description", content: "Sign in or create your EasyLoan account." },
    ],
  }),
  component: AuthLayout,
});

function AuthLayout() {
  const location = useLocation();
  return location.pathname === "/auth" ? <AuthPage /> : <Outlet />;
}

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});
const signInSchema = signUpSchema.pick({ email: true, password: true });

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const [mode, setMode] = useState<Mode>("signup");
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && isEmailVerified(data.user)) navigate({ to: "/dashboard", replace: true });
      else if (active && data.user?.email) setVerificationEmail(data.user.email);
    });
    return () => { active = false; };
  }, [navigate]);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const p = signUpSchema.safeParse(form);
        if (!p.success) return void toast.error(p.error.issues[0]?.message ?? "Invalid input");
        const { error } = await supabase.auth.signUp({
          email: p.data.email,
          password: p.data.password,
          options: { emailRedirectTo: verificationRedirect(window.location.origin), data: { full_name: p.data.full_name, phone: p.data.phone } },
        });
        if (error) throw error;
        setForm({ ...form, password: "" });
        setVerificationEmail(p.data.email);
        setNotice("Check your email and tap Verify Email. You'll go straight to your dashboard without signing in again.");
      } else if (mode === "signin") {
        const p = signInSchema.safeParse(form);
        if (!p.success) return void toast.error(p.error.issues[0]?.message ?? "Invalid input");
        const { error } = await supabase.auth.signInWithPassword(p.data);
        if (error) throw error;
        const { data: verified, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!isEmailVerified(verified.user)) {
          setVerificationEmail(p.data.email);
          return;
        }
        navigate({ to: "/dashboard", replace: true });
      } else {
        const p = z.string().trim().email("Enter a valid email").safeParse(form.email);
        if (!p.success) return void toast.error(p.error.issues[0]?.message ?? "Invalid input");
        const { error } = await supabase.auth.resetPasswordForEmail(p.data, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        setSent("If that email has an account, a reset link is on its way.");
      }
    } catch (err) {
      if (typeof err === "object" && err !== null && "code" in err && err.code === "email_not_confirmed") {
        setVerificationEmail(form.email.trim());
      }
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-hero px-4 py-8">
      <Link to="/" className="mx-auto w-full max-w-md"><Logo light /></Link>
      <div className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-card p-6 shadow-lift animate-rise sm:p-8">
        <h1 className="text-2xl font-bold">
          {verificationEmail ? "Check your email" : mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset password" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {verificationEmail ? "Verify your email to open your dashboard." : mode === "signup" ? "It takes less than a minute." : mode === "forgot" ? "We'll email you a reset link." : "Sign in to manage your loans."}
        </p>
        {verificationEmail ? <>
          {notice && <p role="status" className="mt-6 text-sm text-muted-foreground">{notice}</p>}
          <ResendVerification initialEmail={verificationEmail} />
          <Button variant="link" className="mt-3 w-full" onClick={() => { setVerificationEmail(null); setNotice(null); setMode("signin"); }}>Back to sign in</Button>
        </> : sent ? (
          <div className="mt-6 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">{sent}</div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {notice && mode === "signin" && <div className="rounded-xl bg-success/10 p-3 text-sm font-medium text-success">{notice}</div>}
            {mode === "signup" && (
              <>
                <Field label="Full name"><Input value={form.full_name} onChange={set("full_name")} autoComplete="name" /></Field>
                <Field label="Phone number"><Input value={form.phone} onChange={set("phone")} inputMode="tel" placeholder="0241234567" /></Field>
              </>
            )}
            <Field label="Email"><Input type="email" value={form.email} onChange={set("email")} autoComplete="email" /></Field>
            {mode !== "forgot" && (
              <Field label="Password"><Input type="password" value={form.password} onChange={set("password")} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></Field>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </Button>
          </form>
        )}
        {!verificationEmail && <div className="mt-6 flex flex-col gap-2 text-center text-sm">
          {mode === "signin" && (
            <>
              <button className="text-primary hover:underline" onClick={() => { setMode("forgot"); setSent(null); }}>Forgot password?</button>
              <span className="text-muted-foreground">New here? <button className="font-semibold text-primary hover:underline" onClick={() => { setMode("signup"); setSent(null); }}>Create an account</button></span>
            </>
          )}
          {mode !== "signin" && (
            <button className="font-semibold text-primary hover:underline" onClick={() => { setMode("signin"); setSent(null); }}>Back to sign in</button>
          )}
        </div>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
