import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Eye, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cedi, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin-cash")({
  head: () => ({ meta: [
    { title: "Instant Cash submissions — EasyLoan" },
    { name: "description", content: "Private admin review of Instant Cash payout details and Ghana Card uploads." },
    { property: "og:title", content: "Instant Cash submissions — EasyLoan" },
    { property: "og:description", content: "Private admin review of Instant Cash payout details and Ghana Card uploads." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminCashPage,
});

function AdminCashPage() {
  const { user } = Route.useRouteContext();
  const admin = useIsAdmin(user.id);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ id: string; front_path: string; back_path: string } | null>(null);
  const claims = useQuery({
    queryKey: ["admin-cash", user.id],
    enabled: admin.data === true,
    queryFn: async () => {
      const { data, error } = await supabase.from("cash_claims").select("*, payment_methods(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const photos = useQuery({
    queryKey: ["admin-cash-photos", user.id, selected?.id],
    enabled: admin.data === true && selected !== null,
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      if (!selected) return [];
      return Promise.all([selected.front_path, selected.back_path].map(async (path) => {
        const { data, error } = await supabase.storage.from("kyc").createSignedUrl(path, 120);
        if (error) throw error;
        return data.signedUrl;
      }));
    },
  });

  if (admin.isPending) return <Loader2 className="mx-auto mt-20 animate-spin" />;
  if (!admin.data) return <div className="py-10 text-center"><ShieldCheck className="mx-auto mb-3" /><h1 className="text-xl font-bold">Admin access required</h1></div>;
  const visible = claims.data?.filter((claim) => `${claim.account_name ?? ""} ${claim.account_number ?? ""} ${claim.payment_methods?.name ?? ""} ${claim.amount}`.toLowerCase().includes(search.trim().toLowerCase())) ?? [];

  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">Instant Cash submissions</h1>
      <Button variant="outline" size="icon" aria-label="Refresh submissions" title="Refresh submissions" onClick={() => claims.refetch()}><RefreshCw /></Button>
    </div>
    <Input type="search" aria-label="Search submissions" placeholder="Search account name, number or amount" value={search} onChange={(e) => setSearch(e.target.value)} />
    {claims.isPending ? <Loader2 className="animate-spin" /> : claims.isError ? <p role="alert" className="text-destructive">Submissions could not load. Please refresh.</p> : visible.length === 0 ? <p className="text-muted-foreground">No submissions found.</p> : <div className="divide-y">
      {visible.map((claim) => <article key={claim.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
        <div className="min-w-0 space-y-1">
          <h2 className="break-words font-semibold">{claim.account_name || "Payout details not provided"}</h2>
          <p className="break-all text-sm">{claim.payment_methods?.name ?? "—"} · {claim.account_number ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{shortDate(claim.created_at)} · {cedi(claim.amount)}</p>
        </div>
        <Button variant="outline" onClick={() => setSelected(claim)}><Eye />View uploads</Button>
      </article>)}
    </div>}
    <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>Ghana Card uploads</DialogTitle></DialogHeader>
        {photos.isPending ? <Loader2 className="animate-spin" /> : photos.isError ? <div><p role="alert" className="text-destructive">Photos could not load.</p><Button variant="outline" onClick={() => photos.refetch()}>Retry</Button></div> : <div className="grid gap-4 sm:grid-cols-2">
          {photos.data?.map((url, index) => <figure key={index}><figcaption className="mb-2 font-medium">{index === 0 ? "Front" : "Back"}</figcaption><img src={url} alt={`Ghana Card ${index === 0 ? "front" : "back"}`} className="aspect-[1.6] w-full rounded-lg bg-muted object-contain" /></figure>)}
        </div>}
      </DialogContent>
    </Dialog>
  </div>;
}