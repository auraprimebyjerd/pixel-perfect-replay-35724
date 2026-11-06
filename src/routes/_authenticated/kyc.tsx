import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ImageUp, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/kyc")({
  head: () => ({ meta: [{ title: "Identity verification — EasyLoan" }, { name: "description", content: "Verify your identity with your Ghana Card." }, { property: "og:title", content: "Identity verification — EasyLoan" }, { property: "og:description", content: "Verify your identity with your Ghana Card." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: KycPage,
});

const MAX = 8 * 1024 * 1024;

function KycPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const latest = useQuery({
    queryKey: ["kyc", user.id],
    queryFn: async () => (await supabase.from("kyc_submissions").select("status, admin_note, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
  });
  const [card, setCard] = useState("");
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<Blob | null>(null);
  const [refs, setRefs] = useState({ r1n: "", r1p: "", r2n: "", r2p: "" });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (latest.isLoading) return <Loader2 className="mx-auto mt-20 animate-spin" />;
  if (latest.data && latest.data.status !== "rejected") {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-card p-8 text-center shadow-soft">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-xl font-bold">Identity verification</h1>
        <div className="mt-3"><StatusBadge status={latest.data.status} /></div>
        <p className="mt-3 text-sm text-muted-foreground">{latest.data.status === "approved" ? "You're verified." : "Our team is reviewing your documents."}</p>
      </div>
    );
  }

  async function upload(kind: string, file: Blob) {
    if (file.size > MAX) throw new Error("Each image must be under 8MB");
    const path = `${user.id}/${kind}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("kyc").upload(path, file, { contentType: file.type || "image/jpeg" });
    if (error) throw error;
    return path;
  }

  async function submit() {
    if (!/^GHA-\d{9}-\d$/i.test(card.trim())) return void toast.error("Ghana Card number must look like GHA-123456789-0");
    if (!front || !back) return void toast.error("Upload both sides of your Ghana Card");
    if (!selfie) return void toast.error("Take a selfie");
    if (!consent) return void toast.error("Please give consent to continue");
    setBusy(true);
    try {
      const [f, b, s] = await Promise.all([upload("front", front), upload("back", back), upload("selfie", selfie)]);
      const { error } = await supabase.rpc("submit_kyc", {
        p_card_number: card.trim().toUpperCase(), p_front: f, p_back: b, p_selfie: s,
        p_ref1_name: refs.r1n, p_ref1_phone: refs.r1p.trim(), p_ref2_name: refs.r2n, p_ref2_phone: refs.r2p.trim(), p_consent: consent,
      });
      if (error) throw error;
      toast.success("Verification submitted");
      qc.invalidateQueries();
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verify your identity</h1>
        <p className="text-sm text-muted-foreground">Your documents are stored privately and only seen by our verification team.</p>
        {latest.data?.status === "rejected" && <p className="mt-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">Previous submission rejected{latest.data.admin_note ? `: ${latest.data.admin_note}` : ""}. Please resubmit.</p>}
      </div>
      <section className="space-y-4 rounded-3xl bg-card p-6 shadow-soft">
        <div className="space-y-1.5"><Label>Ghana Card number</Label><Input value={card} onChange={(e) => setCard(e.target.value)} placeholder="GHA-123456789-0" /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FilePick label="Ghana Card — front" file={front} onFile={setFront} />
          <FilePick label="Ghana Card — back" file={back} onFile={setBack} />
        </div>
        <SelfieCapture value={selfie} onChange={setSelfie} />
      </section>
      <section className="space-y-4 rounded-3xl bg-card p-6 shadow-soft">
        <div>
          <h2 className="font-semibold">References</h2>
          <p className="text-sm text-muted-foreground">Two people who know you. We never access your phone's contacts.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Reference 1 name" value={refs.r1n} onChange={(e) => setRefs({ ...refs, r1n: e.target.value })} />
          <Input placeholder="Reference 1 phone" inputMode="tel" value={refs.r1p} onChange={(e) => setRefs({ ...refs, r1p: e.target.value })} />
          <Input placeholder="Reference 2 name" value={refs.r2n} onChange={(e) => setRefs({ ...refs, r2n: e.target.value })} />
          <Input placeholder="Reference 2 phone" inputMode="tel" value={refs.r2p} onChange={(e) => setRefs({ ...refs, r2p: e.target.value })} />
        </div>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
          <span>I consent to EasyLoan processing my Ghana Card, selfie and reference details to verify my identity and assess my loan, in line with the Data Protection Act, 2012 (Act 843).</span>
        </label>
        <Button size="lg" className="w-full" onClick={submit} disabled={busy}>{busy && <Loader2 className="animate-spin" />}Submit verification</Button>
      </section>
    </div>
  );
}

function FilePick({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File) => void }) {
  const url = file ? URL.createObjectURL(file) : null;
  return (
    <label className="flex aspect-[1.6] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-muted text-sm text-muted-foreground hover:border-primary">
      {url ? <img src={url} alt={label} className="h-full w-full object-cover" /> : (<><ImageUp className="mb-2 h-6 w-6" />{label}</>)}
      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
    </label>
  );
}

function SelfieCapture({ value, onChange }: { value: Blob | null; onChange: (b: Blob) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const preview = value ? URL.createObjectURL(value) : null;

  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  async function start() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(s);
      setTimeout(() => { if (video.current) video.current.srcObject = s; }, 0);
    } catch {
      toast.error("Camera unavailable — use the upload option instead");
    }
  }
  function snap() {
    const v = video.current;
    if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    c.toBlob((b) => b && onChange(b), "image/jpeg", 0.9);
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }

  return (
    <div className="space-y-2">
      <Label>Selfie verification</Label>
      <div className="flex aspect-square max-h-72 w-full items-center justify-center overflow-hidden rounded-2xl bg-muted">
        {stream ? <video ref={video} autoPlay playsInline muted className="h-full w-full object-cover" /> : preview ? <img src={preview} alt="Selfie" className="h-full w-full object-cover" /> : <Camera className="h-10 w-10 text-muted-foreground" />}
      </div>
      <div className="flex gap-2">
        {stream ? <Button onClick={snap} className="flex-1">Capture</Button> : <Button variant="secondary" onClick={start} className="flex-1"><Camera />{value ? "Retake" : "Open camera"}</Button>}
        <Button variant="outline" asChild>
          <label className="cursor-pointer">Upload<input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])} /></label>
        </Button>
      </div>
    </div>
  );
}
