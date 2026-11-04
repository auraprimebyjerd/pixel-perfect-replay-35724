import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Empty } from "@/components/Empty";
import { cedi, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { filterTransactions, TX_FILTERS, txLabel, type TxFilter } from "@/lib/transactions";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Wallet — EasyLoan" }, { name: "description", content: "Your wallet balance and withdrawals." }] }),
  component: WalletPage,
});

function WalletPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["wallet", user.id],
    queryFn: async () => {
      const [w, m, wd, tx] = await Promise.all([
        supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase.from("payment_methods").select("id, name").eq("active", true).order("name"),
        supabase.from("withdrawals").select("*, payment_methods(name)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      return { balance: Number(w.data?.balance ?? 0), methods: m.data ?? [], withdrawals: wd.data ?? [], txs: tx.data ?? [] };
    },
  });
  const [form, setForm] = useState({ amount: "", method: "", number: "", name: "" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TxFilter>("all");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return void toast.error("Enter a valid amount");
    if (amount > (q.data?.balance ?? 0)) return void toast.error("Amount exceeds your balance");
    if (!form.method) return void toast.error("Choose a payment method");
    setBusy(true);
    const { error } = await supabase.rpc("request_withdrawal", { p_amount: amount, p_method: form.method, p_account_number: form.number.trim(), p_account_name: form.name.trim() });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Withdrawal requested");
    setForm({ amount: "", method: "", number: "", name: "" });
    qc.invalidateQueries();
  }

  if (!q.data) return <Loader2 className="mx-auto mt-20 animate-spin" />;
  const d = q.data;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-3xl bg-balance p-6 text-navy-foreground shadow-lift">
          <p className="text-sm text-navy-foreground/70">Wallet balance</p>
          <p className="mt-2 font-display text-4xl font-bold">{cedi(d.balance)}</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-3xl bg-card p-6 shadow-soft">
          <h2 className="font-semibold">Request a withdrawal</h2>
          <div className="space-y-1.5"><Label>Amount</Label><Input type="number" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
              <SelectTrigger><SelectValue placeholder="Choose method" /></SelectTrigger>
              <SelectContent>{d.methods.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Mobile money / account number</Label><Input inputMode="numeric" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Account name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <Button type="submit" size="lg" className="w-full" disabled={busy || d.balance <= 0}>{busy && <Loader2 className="animate-spin" />}Withdraw</Button>
          {d.balance <= 0 && <p className="text-center text-xs text-muted-foreground">Funds appear here once a loan is approved.</p>}
        </form>
      </div>
      <div className="space-y-6">
        <div className="rounded-3xl bg-card p-6 shadow-soft">
          <h2 className="mb-2 font-semibold">Withdrawals</h2>
          {d.withdrawals.length === 0 ? <Empty text="No withdrawals yet." /> : (
            <div className="divide-y">{d.withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between py-3">
                <div><p className="text-sm font-medium">{w.payment_methods?.name} · {w.account_number}</p><p className="text-xs text-muted-foreground">{shortDate(w.created_at)}{w.admin_note ? ` · ${w.admin_note}` : ""}</p></div>
                <div className="text-right"><p className="text-sm font-semibold">{cedi(w.amount)}</p><StatusBadge status={w.status} /></div>
              </div>
            ))}</div>
          )}
        </div>
        <div className="rounded-3xl bg-card p-6 shadow-soft">
          <h2 className="mb-3 font-semibold">Transactions</h2>
          <div className="space-y-3">
            <Input
              type="search"
              placeholder="Search by description, type or amount…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {TX_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {(() => {
            if (d.txs.length === 0) return <Empty text="No transactions yet." />;
            const filtered = filterTransactions(d.txs, search, filter);
            if (filtered.length === 0) return <Empty text="No transactions match your search." />;
            return (
              <div className="mt-3 divide-y">
                {filtered.map((t) => {
                  const wd = t.kind === "withdrawal" && t.reference_id
                    ? d.withdrawals.find((w) => w.id === t.reference_id)
                    : undefined;
                  return (
                    <div key={t.id} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{t.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {txLabel(t.kind)} · {shortDate(t.created_at)}
                            {wd ? ` · ${wd.payment_methods?.name} · ${wd.account_number}` : ""}
                          </p>
                        </div>
                        <p className={Number(t.amount) < 0 ? "text-sm font-semibold text-destructive" : "text-sm font-semibold text-success"}>{cedi(t.amount)}</p>
                      </div>
                      {wd && wd.account_name && (
                        <p className="mt-1 text-xs text-muted-foreground">Paid to {wd.account_name}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
