import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { completeEmailVerification, isEmailVerified, verificationRedirect } from "@/lib/email-verification";

function client(confirmed = true, session = true) {
  return {
    getSession: vi.fn().mockResolvedValue({ data: { session: session ? { user: { id: "user-1" } } : null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email_confirmed_at: confirmed ? "2026-11-06T12:00:00Z" : null } }, error: null }),
    exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
    verifyOtp: vi.fn().mockResolvedValue({ error: null }),
    setSession: vi.fn().mockResolvedValue({ error: null }),
  };
}
const run = (auth: ReturnType<typeof client>, url: string) => completeEmailVerification(auth as unknown as SupabaseClient["auth"], url);

describe("Email verification", () => {
  it("targets the public callback on the deployed origin", () => {
    expect(verificationRedirect("https://cedibridge.vercel.app")).toBe("https://cedibridge.vercel.app/auth/callback");
  });
  it("exchanges a PKCE code before checking the verified user", async () => {
    const auth = client();
    await expect(run(auth, "https://app.example/auth/callback?code=verification-code")).resolves.toMatchObject({ id: "user-1" });
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("verification-code");
  });
  it("verifies a token hash on a fresh device", async () => {
    const auth = client();
    await run(auth, "https://app.example/auth/callback?token_hash=hash-value&type=signup");
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "hash-value", type: "signup" });
  });
  it("restores both implicit session tokens", async () => {
    const auth = client();
    await run(auth, "https://app.example/auth/callback#access_token=test-access&refresh_token=test-refresh&type=signup");
    expect(auth.setSession).toHaveBeenCalledWith({ access_token: "test-access", refresh_token: "test-refresh" });
  });
  it("allows an already verified session without a new link", async () => {
    await expect(run(client(), "https://app.example/auth/callback")).resolves.toMatchObject({ id: "user-1" });
  });
  it("rejects an expired link even with an existing session", async () => {
    const auth = client();
    await expect(run(auth, "https://app.example/auth/callback#error=access_denied&error_code=otp_expired")).rejects.toThrow("expired");
    expect(auth.getUser).not.toHaveBeenCalled();
  });
  it("rejects a missing session", async () => {
    await expect(run(client(true, false), "https://app.example/auth/callback")).rejects.toThrow("invalid");
  });
  it("blocks unverified users from protected pages", async () => {
    expect(isEmailVerified({})).toBe(false);
    expect(isEmailVerified(null)).toBe(false);
    expect(isEmailVerified({ email_confirmed_at: "2026-11-06T12:00:00Z" })).toBe(true);
    await expect(run(client(false), "https://app.example/auth/callback")).rejects.toThrow("not verified");
  });
  it("does not accept password recovery as email verification", async () => {
    await expect(run(client(), "https://app.example/auth/callback?token_hash=hash-value&type=recovery")).rejects.toThrow("not an email verification");
  });
});