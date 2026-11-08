import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Camera, CheckCircle2, Gift, ImageUp, Loader2 } from "lucide-react";
import { checkPhotoQuality } from "@/lib/photo-quality";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/instant-cash")({
  head: () => ({
    meta: [
      { title: "Claim instant cash — EasyLoan" },
      { name: "description", content: "Upload your Ghana Card and get a one-time cash bonus in your wallet." }, { property: "og:title", content: "Claim instant cash — EasyLoan" }, { property: "og:description", content: "Upload your Ghana Card and get a one-time cash bonus in your wallet." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InstantCashPage,
});

export const CASH_AMOUNTS = [200, 500, 1000];
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
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");

  if (claim.isLoading) return <Loader2 className="mx-auto mt-20 animate-spin" />;

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
    if (token.length < 4) return void toast.error("Enter your token code");
    if (secret.length < 4) return void toast.error("Enter your secret code");
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
        <p className="text-sm text-muted-foreground">A bonus paid straight to your wallet. No repayment needed.</p>
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
        <h2 className="font-semibold">Token & secret code</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-medium">
            Token code
            <Input value={token} onChange={(e) => setToken(e.target.value.trim())} placeholder="Enter token code" autoComplete="off" />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Secret code
            <Input type="password" inputMode="numeric" value={secret} onChange={(e) => setSecret(e.target.value.trim())} placeholder="Enter secret code" autoComplete="off" />
          </label>
        </div>
      </section>
      <section className="space-y-4 rounded-3xl bg-card p-6 shadow-soft">
        <h2 className="font-semibold">Ghana Card</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <FilePick label="Front" file={front} onFile={setFront} />
          <FilePick label="Back" file={back} onFile={setBack} />
        </div>
        <p className="text-xs text-muted-foreground">Use a clear, well-lit photo with all four corners of the card visible.</p>
      </section>
      <Button size="lg" className="h-14 w-full rounded-2xl text-base font-bold btn-3d ring-4 ring-primary/20" onClick={submit} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Gift />}Claim {amount ? `GH₵${amount.toLocaleString()}` : "instant cash"}
      </Button>
    </div>
  );
}

function FilePick({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File) => void }) {
  const [checking, setChecking] = useState(false);
  const url = file ? URL.createObjectURL(file) : null;
  async function pick(f?: File) {
    if (!f) return;
    setChecking(true);
    try {
      const problem = await checkPhotoQuality(f);
      if (problem) toast.error(`${label}: ${problem}`);
      else { onFile(f); toast.success(`${label} photo looks good`); }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setChecking(false);
    }
  }
  return (
    <div className="space-y-2">
      <div className="relative flex aspect-[1.6] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-muted text-sm text-muted-foreground">
        {checking ? <Loader2 className="animate-spin" /> : url ? <img src={url} alt={`Ghana Card ${label}`} className="h-full w-full object-cover" /> : (<><ImageUp className="mb-2 h-6 w-6" />Ghana Card — {label.toLowerCase()}</>)}
        {url && !checking && <CheckCircle2 className="absolute right-2 top-2 h-6 w-6 rounded-full bg-card text-success" />}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" size="sm" asChild>
          <label className="cursor-pointer"><Camera />Take photo<input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} /></label>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <label className="cursor-pointer"><ImageUp />Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} /></label>
        </Button>
      </div>
    </div>
  );
}
