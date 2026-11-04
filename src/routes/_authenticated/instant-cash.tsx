import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Gift, ImageUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/instant-cash")({
  head: () => ({
    meta: [
      { title: "Claim instant cash — EasyLoan" },
      { name: "description", content: "Upload your Ghana Card and get a one-time cash bonus in your wallet." },
    ],
  }),
  component: InstantCashPage,
});

export const CASH_AMOUNTS = [1, 200, 500, 1000];
const MAX = 8 * 1024 * 1024;

function InstantCashPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const claim = useQuery({
    queryKey: ["cash-claim", user.id],
    queryFn: async () => (await supabase.from("cash_claims").select("amount, created_at").eq("user_id", user.id).maybeSingle()).data,
  });
  const [amount, setAmount] = useState<number | null>(null);
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  if (claim.isLoading) return <Loader2 className="mx-auto mt-20 animate-spin" />;
  if (claim.data) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-card p-8 text-center shadow-soft">
        <Gift className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-xl font-bold">Instant cash claimed</h1>
        <p className="mt-2 text-sm text-muted-foreground">GH₵{Number(claim.data.amount).toLocaleString()} was added to your wallet. This bonus can only be claimed once.</p>
        <Button asChild className="mt-6"><Link to="/wallet">Go to wallet</Link></Button>
      </div>
    );
  }

  async function upload(kind: string, file: File) {
    if (file.size > MAX) throw new Error("Each image must be under 8MB");
    const path = `${user.id}/cash-${kind}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("kyc").upload(path, file, { contentType: file.type || "image/jpeg" });
    if (error) throw error;
    return path;
  }

  async function submit() {
    if (!amount) return void toast.error("Choose an amount");
    if (!front || !back) return void toast.error("Upload both sides of your Ghana Card");
    setBusy(true);
    try {
      const [f, b] = await Promise.all([upload("front", front), upload("back", back)]);
      const { error } = await supabase.rpc("claim_instant_cash", { p_amount: amount, p_front: f, p_back: b });
      if (error) throw error;
      toast.success(`GH₵${amount} added to your wallet`);
      qc.invalidateQueries();
      navigate({ to: "/wallet" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Claim instant cash</h1>
        <p className="text-sm text-muted-foreground">A one-time bonus paid straight to your wallet. No repayment needed.</p>
      </div>
      <section className="space-y-4 rounded-3xl bg-card p-6 shadow-soft">
        <h2 className="font-semibold">Choose amount</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CASH_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a)}
              className={cn(
                "rounded-2xl border-2 p-4 font-display text-lg font-bold transition-colors",
                amount === a ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted hover:border-primary",
              )}
            >
              GH₵{a.toLocaleString()}
            </button>
          ))}
        </div>
      </section>
      <section className="space-y-4 rounded-3xl bg-card p-6 shadow-soft">
        <h2 className="font-semibold">Ghana Card</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <FilePick label="Front" file={front} onFile={setFront} />
          <FilePick label="Back" file={back} onFile={setBack} />
        </div>
        <Button size="lg" className="w-full" onClick={submit} disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}Claim {amount ? `GH₵${amount.toLocaleString()}` : "cash"}
        </Button>
      </section>
    </div>
  );
}

function FilePick({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File) => void }) {
  const url = file ? URL.createObjectURL(file) : null;
  return (
    <label className="flex aspect-[1.6] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-muted text-sm text-muted-foreground hover:border-primary">
      {url ? <img src={url} alt={`Ghana Card ${label}`} className="h-full w-full object-cover" /> : (<><ImageUp className="mb-2 h-6 w-6" />Ghana Card — {label.toLowerCase()}</>)}
      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
    </label>
  );
}
