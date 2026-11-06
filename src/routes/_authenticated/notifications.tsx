import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/Empty";
import { shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — EasyLoan" }, { name: "description", content: "Updates on your account." }, { property: "og:title", content: "Notifications — EasyLoan" }, { property: "og:description", content: "Updates on your account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications", user.id],
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? [],
  });
  async function markAll() {
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    qc.invalidateQueries();
  }
  const list = q.data ?? [];
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {list.some((n) => !n.read) && <Button variant="ghost" size="sm" onClick={markAll}>Mark all read</Button>}
      </div>
      <div className="rounded-3xl bg-card p-2 shadow-soft">
        {list.length === 0 ? <Empty text="You're all caught up." /> : list.map((n) => (
          <div key={n.id} className={cn("flex gap-3 rounded-2xl p-4", !n.read && "bg-accent")}>
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div><p className="font-medium">{n.title}</p><p className="text-sm text-muted-foreground">{n.body}</p><p className="mt-1 text-xs text-muted-foreground">{shortDate(n.created_at)}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
