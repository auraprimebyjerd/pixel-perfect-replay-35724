import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Bell, FileText, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { cedi, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EasyLoan" }, { name: "description", content: "Your loans, wallet and activity." }] }),
  component: Dashboard,
});

function useDashboard() {
  const { user } = Route.useRouteContext();
  return useQuery({
    queryKey: ["dashboard", user.id],
    queryFn: async () => {
      const [profile, wallet, loans, wds, txs, notifs, kyc, settings] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase.from("loan_applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("withdrawals").select("*, payment_methods(name)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("notifications").select("*").eq("user_id", user.id).eq("read", false),
        supabase.from("kyc_submissions").select("status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("lending_settings").select("max_amount").eq("id", 1).single(),
      ]);
      const loanList = loans.data ?? [];
      const outstanding = loanList.filter((l) => l.status === "approved").reduce((s, l) => s + Number(l.amount), 0);
      return {
        name: profile.data?.full_name ?? "",
        balance: Number(wallet.data?.balance ?? 0),
        loanAvailable: Math.max(0, Number(settings.data?.max_amount ?? 0) - outstanding),
        loans: loanList,
        withdrawals: wds.data ?? [],
        txs: txs.data ?? [],
        unread: notifs.data?.length ?? 0,
        kyc: kyc.data?.status ?? null,
      };
    },
  });
}

function Dashboard() {
  const { data, isLoading } = useDashboard();
  if (isLoading || !data) return <div className="space-y-4"><Skeleton className="h-44 rounded-3xl" /><Skeleton className="h-64 rounded-2xl" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-bold">{data.name || "Your account"}</h1>
        </div>
        <Link to="/notifications" className="relative rounded-full bg-card p-3 shadow-soft">
          <Bell className="h-5 w-5" />
          {data.unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">{data.unread}</span>}
        </Link>
      </div>

      {data.kyc !== "approved" && (
        <Link to="/kyc" className="flex items-center gap-3 rounded-2xl border border-sky bg-accent p-4 text-accent-foreground">
          <ShieldCheck className="h-6 w-6 shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">{data.kyc === "pending" ? "Verification under review" : data.kyc === "rejected" ? "Verification needs attention" : "Verify your identity"}</p>
            <p className="text-accent-foreground/75">{data.kyc === "pending" ? "We'll notify you once it's done." : "Required before any loan can be approved."}</p>
          </div>
        </Link>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-balance p-6 text-navy-foreground shadow-lift">
          <p className="text-sm text-navy-foreground/70">Available withdrawal balance</p>
          <p className="mt-2 font-display text-4xl font-bold">{cedi(data.balance)}</p>
          <Button asChild variant="hero" className="mt-6"><Link to="/wallet">Withdraw</Link></Button>
        </div>
        <div className="rounded-3xl bg-card p-6 shadow-soft">
          <p className="text-sm text-muted-foreground">Available loan limit</p>
          <p className="mt-2 font-display text-4xl font-bold text-primary">{cedi(data.loanAvailable)}</p>
          <div className="mt-6 flex gap-2">
            <Button asChild><Link to="/apply">Apply for loan</Link></Button>
            <Button asChild variant="secondary"><Link to="/calculator">Calculate</Link></Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-soft sm:p-6">
        <h2 className="mb-3 font-semibold">Loan applications</h2>
        <Tabs defaultValue="all">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>
          {(["all", "pending", "approved"] as const).map((t) => {
            const list = data.loans.filter((l) => t === "all" || l.status === t);
            return (
              <TabsContent key={t} value={t} className="mt-3 divide-y">
                {list.length === 0 ? (
                  <Empty text="No applications here yet." />
                ) : (
                  list.map((l) => (
                    <div key={l.id} className="flex items-center gap-3 py-3">
                      <div className="rounded-xl bg-secondary p-2.5 text-secondary-foreground"><FileText className="h-4 w-4" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{l.purpose}</p>
                        <p className="text-xs text-muted-foreground">{shortDate(l.created_at)} · {l.duration_months} mo · {cedi(l.monthly_repayment)}/mo</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{cedi(l.amount)}</p>
                        <StatusBadge status={l.status} />
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-card p-4 shadow-soft sm:p-6">
          <h2 className="mb-2 font-semibold">Account activity</h2>
          {data.txs.length === 0 ? <Empty text="No activity yet." /> : (
            <div className="divide-y">
              {data.txs.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-3">
                  {Number(t.amount) >= 0 ? <ArrowDownLeft className="h-4 w-4 text-success" /> : <ArrowUpRight className="h-4 w-4 text-destructive" />}
                  <div className="flex-1"><p className="text-sm font-medium">{t.description}</p><p className="text-xs text-muted-foreground">{shortDate(t.created_at)}</p></div>
                  <p className="text-sm font-semibold">{cedi(t.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-soft sm:p-6">
          <h2 className="mb-2 font-semibold">Withdrawal history</h2>
          {data.withdrawals.length === 0 ? <Empty text="No withdrawals yet." /> : (
            <div className="divide-y">
              {data.withdrawals.slice(0, 8).map((w) => (
                <div key={w.id} className="flex items-center justify-between py-3">
                  <div><p className="text-sm font-medium">{w.payment_methods?.name}</p><p className="text-xs text-muted-foreground">{shortDate(w.created_at)}</p></div>
                  <div className="text-right"><p className="text-sm font-semibold">{cedi(w.amount)}</p><StatusBadge status={w.status} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>;
}
