import { cn } from "@/lib/utils";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2 font-display text-lg font-bold", light ? "text-navy-foreground" : "text-navy")}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky text-navy">E</span>
      EasyLoan
    </span>
  );
}
