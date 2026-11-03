import { LifeBuoy, Mail } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL } from "@/lib/format";

const faqs = [
  ["How long does approval take?", "Applications are reviewed by our team once your identity verification is approved."],
  ["Do I pay anything before getting a loan?", "No. EasyLoan never asks for upfront fees, vouchers or codes to release a loan."],
  ["How do I withdraw?", "Approved loans go to your wallet. Open Wallet and request a withdrawal to your mobile money or bank account."],
  ["Is my Ghana Card safe?", "Documents are stored privately and only our verification team can view them."],
];

export function HelpButton() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          aria-label="Help and support"
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sky text-navy shadow-lift transition-transform hover:scale-105 md:bottom-6"
        >
          <LifeBuoy className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>How can we help?</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6">
          <Accordion type="single" collapsible>
            {faqs.map(([q = "", a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <Button asChild className="mt-4 w-full" size="lg">
            <a href={`mailto:${SUPPORT_EMAIL}`}>
              <Mail /> Email support
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
