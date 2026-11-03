import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLendingRules, useQuote } from "@/hooks/use-lending";
import { cedi, errMsg } from "@/lib/format";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ amount: z.number().optional(), duration: z.number().optional() });

export const Route = createFileRoute("/_authenticated/apply")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse({ amount: s["amount"] ? Number(s["amount"]) : undefined, duration: s["duration"] ? Number(s["duration"]) : undefined }),
  head: () => ({ meta: [{ title: "Apply for a loan — EasyLoan" }, { name: "description", content: "Apply for an EasyLoan personal loan." }] }),
  component: ApplyPage,
});

const steps = ["Loan", "Details", "Review"];
const phoneRe = /^\+?[0-9]{9,15}$/;

function ApplyPage() {
  const search = Route.useSearch();
  const { user } = Route.useRouteContext();
  const { data: rules } = useLendingRules();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    amount: search.amount ?? 1000,
    duration: search.duration ?? 0,
    purpose: "",
    date_needed: new Date().toISOString().slice(0, 10),
    full_name: "",
    phone: "",
    email: user.email ?? "",
  });

  useEffect(() => {
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setF((p) => ({ ...p, full_name: p.full_name || data.full_name || "", phone: p.phone || data.phone || "" }));
    });
  }, [user.id]);
  useEffect(() => {
    if (rules && !f.duration && rules.terms[0]) setF((p) => ({ ...p, duration: rules.terms[0]!.duration_months }));
  }, [rules, f.duration]);

  const quote = useQuote(f.amount, f.duration || null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  function next() {
    if (step === 0) {
      if (!quote.data) return void toast.error(quote.error ? errMsg(quote.error) : "Choose an amount and duration");
      if (f.purpose.trim().length < 3) return void toast.error("Tell us what the loan is for");
    }
    if (step === 1) {
      if (f.full_name.trim().length < 2) return void toast.error("Enter your full name");
      if (!phoneRe.test(f.phone.trim())) return void toast.error("Enter a valid phone number");
      if (!z.string().email().safeParse(f.email.trim()).success) return void toast.error("Enter a valid email");
      if (!f.date_needed || f.date_needed < new Date().toISOString().slice(0, 10)) return void toast.error("Date needed cannot be in the past");
    }
    setStep(step + 1);
  }

  async function submit() {
    setBusy(true);
    const { error } = await supabase.rpc("submit_loan_application", {
      p_purpose: f.purpose.trim(),
      p_full_name: f.full_name.trim(),
      p_phone: f.phone.trim(),
      p_email: f.email.trim(),
      p_date_needed: f.date_needed,
      p_amount: Number(f.amount),
      p_duration: Number(f.duration),
    });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Application submitted");
    qc.invalidateQueries();
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Apply for a loan</h1>
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold", i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className="text-sm font-medium">{s}</span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-3xl bg-card p-6 shadow-soft animate-rise" key={step}>
        {step === 0 && rules && (
          <>
            <F label={`Loan amount (${cedi(rules.min)} – ${cedi(rules.max)})`}><Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} /></F>
            <F label="Repayment duration">
              <div className="grid grid-cols-4 gap-2">
                {rules.terms.map((t) => (
                  <button key={t.id} type="button" onClick={() => setF({ ...f, duration: t.duration_months })} className={cn("rounded-xl border py-2.5 text-sm font-semibold", f.duration === t.duration_months ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>
                    {t.duration_months} mo
                  </button>
                ))}
              </div>
            </F>
            <F label="Purpose of loan"><Textarea value={f.purpose} onChange={set("purpose")} maxLength={500} placeholder="e.g. Restocking my shop" /></F>
            {quote.data && <p className="rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">{cedi(quote.data.monthly_repayment)}/month · total {cedi(quote.data.total_repayment)}</p>}
            {quote.error && <p className="text-sm text-destructive">{errMsg(quote.error)}</p>}
          </>
        )}
        {step === 1 && (
          <>
            <F label="Full name"><Input value={f.full_name} onChange={set("full_name")} maxLength={120} /></F>
            <F label="Phone number"><Input value={f.phone} onChange={set("phone")} inputMode="tel" /></F>
            <F label="Email address"><Input type="email" value={f.email} onChange={set("email")} /></F>
            <F label="Date needed"><Input type="date" value={f.date_needed} onChange={set("date_needed")} /></F>
          </>
        )}
        {step === 2 && quote.data && (
          <dl className="divide-y text-sm">
            {[
              ["Amount", cedi(quote.data.amount)],
              ["Duration", `${f.duration} months`],
              ["Interest rate", `${Number(quote.data.monthly_rate_percent)}% per month`],
              ["Monthly repayment", cedi(quote.data.monthly_repayment)],
              ["Total repayment", cedi(quote.data.total_repayment)],
              ["Purpose", f.purpose],
              ["Name", f.full_name],
              ["Phone", f.phone],
              ["Email", f.email],
              ["Date needed", f.date_needed],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
            ))}
          </dl>
        )}
        <div className="flex gap-2 pt-2">
          {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
          {step < 2 ? (
            <Button className="flex-1" onClick={next}>Continue</Button>
          ) : (
            <Button className="flex-1" onClick={submit} disabled={busy}>{busy && <Loader2 className="animate-spin" />}Submit application</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
