import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Lock, Smartphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EasyLoan — Fast, fair digital loans in Ghana" },
      { name: "description", content: "Transparent personal loans with clear rates, Ghana Card verification and mobile money withdrawals." },
      { property: "og:title", content: "EasyLoan — Fast, fair digital loans in Ghana" },
      { property: "og:description", content: "Transparent personal loans with clear rates and mobile money withdrawals." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: BadgeCheck, title: "Clear pricing", text: "See your rate, total and monthly repayment before you apply." },
  { icon: Lock, title: "Private by design", text: "Your Ghana Card and selfie are stored privately and reviewed by our team only." },
  { icon: Wallet, title: "Mobile money ready", text: "Withdraw approved funds to MTN MoMo, Telecel Cash, AirtelTigo or your bank." },
  { icon: Smartphone, title: "No upfront fees", text: "We never ask for vouchers, codes or payments to release your loan." },
];

function Index() {
  return (
    <div className="min-h-screen">
      <section className="bg-hero text-navy-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Logo light />
          <Button asChild variant="glass" size="sm"><Link to="/auth">Sign in</Link></Button>
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 md:grid-cols-2 md:pb-24">
          <div className="animate-rise">
            <p className="text-sm font-semibold uppercase tracking-widest text-sky">Personal loans · Ghana</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">Borrow with <span className="text-gradient">clarity</span>, not surprises.</h1>
            <p className="mt-5 max-w-md text-lg text-navy-foreground/75">
              Check your repayment in seconds, verify with your Ghana Card, and receive approved funds in your EasyLoan wallet.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg"><Link to="/auth">Get started</Link></Button>
              <Button asChild variant="glass" size="lg"><Link to="/calculator">Calculate a loan</Link></Button>
            </div>
          </div>
          <img src={hero} alt="Shop owner in Accra checking her phone" width={1024} height={1280} className="mx-auto aspect-[4/5] w-full max-w-sm rounded-3xl object-cover shadow-lift animate-float card-3d" />
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <div key={f.title} style={{ animationDelay: `${i * 90}ms` }} className="animate-rise card-3d rounded-2xl bg-card p-6">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
      <footer className="border-t px-4 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} EasyLoan. Borrow responsibly. Loans are subject to identity verification and approval.
      </footer>
    </div>
  );
}
