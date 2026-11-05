import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={cn("group flex items-center gap-2 font-display text-lg font-bold", light ? "text-navy-foreground" : "text-navy")}>
      <img src={logo} alt="EasyLoan logo" width={36} height={36} className="h-9 w-9 drop-shadow-lg transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 animate-float" />
      EasyLoan
    </span>
  );
}
