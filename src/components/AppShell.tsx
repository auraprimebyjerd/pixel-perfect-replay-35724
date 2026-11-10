import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Calculator, Home, LogOut, Wallet, FileText, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { useUser, useIsAdmin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/apply", label: "Apply", icon: FileText },
  { to: "/calculator", label: "Calculator", icon: Calculator },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/notifications", label: "Alerts", icon: Bell },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useUser();
  const admin = useIsAdmin(user?.id);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <header className="sticky top-0 z-30 border-b bg-card/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/dashboard"><Logo /></Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground" activeProps={{ className: "bg-secondary text-secondary-foreground" }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            {admin.data && <Button variant="ghost" size="icon" asChild><Link to="/admin-cash" aria-label="Instant Cash submissions" title="Instant Cash submissions"><ShieldCheck /></Link></Button>}
                        <button onClick={signOut} aria-label="Sign out" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 animate-rise">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground" activeProps={{ className: "text-primary" }}>
              <n.icon className="h-5 w-5" />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
