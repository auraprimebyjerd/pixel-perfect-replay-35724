import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  pending: "bg-warning/20 text-warning-foreground",
  approved: "bg-success/15 text-success",
  paid: "bg-success/15 text-success",
  repaid: "bg-secondary text-secondary-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", styles[status] ?? "bg-muted text-muted-foreground")}>
      {status}
    </span>
  );
}
