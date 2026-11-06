import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { completeEmailVerification } from "@/lib/email-verification";
import { ResendVerification } from "@/components/ResendVerification";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [
    { title: "Verify email — EasyLoan" },
    { name: "description", content: "Verify your EasyLoan email and securely continue to your dashboard." },
    { property: "og:title", content: "Verify email — EasyLoan" },
    { property: "og:description", content: "Verify your email and continue to your EasyLoan dashboard." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: VerificationCallback,
});

function VerificationCallback() {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const request = useRef<ReturnType<typeof completeEmailVerification> | null>(null);
  useEffect(() => {
    let active = true;
    request.current ??= completeEmailVerification(supabase.auth, window.location.href);
    request.current.then(async () => {
      if (!active) return;
      window.history.replaceState(window.history.state, "", "/auth/callback");
      await navigate({ to: "/dashboard", replace: true });
    }).catch(() => {
      if (!active) return;
      window.history.replaceState(window.history.state, "", "/auth/callback");
      setFailed(true);
    });
    return () => { active = false; };
  }, [navigate]);

  return <div className="flex min-h-screen flex-col items-center bg-hero px-4 py-8">
    <Logo light />
    <div className="mt-10 w-full max-w-md rounded-3xl bg-card p-6 shadow-lift sm:p-8">
      {failed ? <>
        <h1 className="text-2xl font-bold">Let's verify your email</h1>
        <p role="alert" className="mt-3 text-sm text-muted-foreground">This link is invalid, expired, or has already been used. Request a fresh verification email to continue.</p>
        <ResendVerification />
      </> : <div role="status" className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-primary" /><h1 className="text-lg font-semibold">Verifying your email…</h1></div>}
    </div>
  </div>;
}