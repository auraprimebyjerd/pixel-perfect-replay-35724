import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLendingRules, useQuote } from "@/hooks/use-lending";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cedi, errMsg } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calculator")({
  head: () => ({ meta: [{ title: "Loan calculator — EasyLoan" }, { name: "description", content: "See your rate and repayments before you apply." }] }),
  component: CalculatorPage,
});

function CalculatorPage() {
  const { data: rules } = useLendingRules();
  const [amount, setAmount] = useState(1000);
  const [duration, setDuration] = useState<number | null>(null);
  useEffect(() => {
    if (rules && duration === null && rules.terms[0]) setDuration(rules.terms[0].duration_months);
  }, [rules, duration]);
  const quote = useQuote(amount, duration);

  if (!rules) return <Loader2 className="mx-auto mt-20 animate-spin" />;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Loan calculator</h1>
      <div className="space-y-6 rounded-3xl bg-card p-6 shadow-soft">
        <div className="space-y-3">
          <Label>How much do you need?</Label>
          <Input type="number" inputMode="decimal" value={amount} min={rules.min} max={rules.max} onChange={(e) => setAmount(Number(e.target.value))} className="h-12 text-lg font-semibold" />
          <Slider value={[Math.min(Math.max(amount, rules.min), rules.max)]} min={rules.min} max={rules.max} step={50} onValueChange={([v]) => setAmount(v)} />
          <div className="flex justify-between text-xs text-muted-foreground"><span>{cedi(rules.min)}</span><span>{cedi(rules.max)}</span></div>
        </div>
        <div className="space-y-3">
          <Label>Repayment duration</Label>
          <div className="grid grid-cols-4 gap-2">
            {rules.terms.map((t) => (
              <button key={t.id} onClick={() => setDuration(t.duration_months)} className={cn("rounded-xl border py-3 text-sm font-semibold transition", duration === t.duration_months ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>
                {t.duration_months} mo
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-balance p-6 text-navy-foreground shadow-lift">
        {quote.isFetching ? (
          <Loader2 className="mx-auto animate-spin" />
        ) : quote.error ? (
          <p className="text-sm">{errMsg(quote.error)}</p>
        ) : quote.data ? (
          <>
            <p className="text-sm text-navy-foreground/70">Estimated monthly repayment</p>
            <p className="font-display text-4xl font-bold">{cedi(quote.data.monthly_repayment)}</p>
            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <Stat label="Interest rate" value={`${Number(quote.data.monthly_rate_percent)}%/mo`} />
              <Stat label="Total interest" value={cedi(quote.data.total_interest)} />
              <Stat label="Total repayment" value={cedi(quote.data.total_repayment)} />
            </div>
            <Button asChild variant="hero" size="lg" className="mt-6 w-full">
              <Link to="/apply" search={{ amount, duration: duration ?? undefined }}>Apply for this loan</Link>
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-navy-foreground/60">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
