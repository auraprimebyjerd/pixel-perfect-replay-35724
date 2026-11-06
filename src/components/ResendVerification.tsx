import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { verificationRedirect } from "@/lib/email-verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResendVerification({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function resend(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup", email: email.trim(),
        options: { emailRedirectTo: verificationRedirect(window.location.origin) },
      });
      if (error) throw error;
      setMessage("If this account needs verification, a new email is on its way. Check your inbox and spam folder.");
    } catch {
      setMessage("We couldn't send the email right now. Please wait a minute and try again.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={resend} className="mt-5 space-y-3">
    <Label htmlFor="verification-email">Email address</Label>
    <Input id="verification-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    <Button type="submit" variant="outline" className="w-full" disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <Mail />} Resend verification email
    </Button>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
  </form>;
}