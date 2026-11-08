import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { registerAccount } from "@/lib/account-registration";

const credentials = { email: "borrower@example.test", password: "example-password", full_name: "Test Borrower", phone: "0241234567" };
function setup(session = true) {
  const auth = {
    signUp: vi.fn().mockResolvedValue({ data: { user: { identities: [{ id: "identity" }] }, session: session ? {} : null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
  const clear = vi.fn().mockResolvedValue(undefined);
  const run = () => registerAccount(auth as unknown as SupabaseClient["auth"], credentials, "https://app.example/auth/callback", clear);
  return { auth, clear, run };
}
describe("Account registration", () => {
  it("ends the automatic signup session so users must log in with credentials", async () => {
    const { auth, clear, run } = setup();
    await expect(run()).resolves.toEqual({ needsConfirmation: false });
    expect(auth.signUp).toHaveBeenCalledWith({ email: credentials.email, password: credentials.password, options: { emailRedirectTo: "https://app.example/auth/callback", data: { full_name: credentials.full_name, phone: credentials.phone } } });
    expect(clear).toHaveBeenCalledOnce();
    expect(auth.signOut).toHaveBeenCalledOnce();
    expect(clear.mock.invocationCallOrder[0]).toBeLessThan(auth.signOut.mock.invocationCallOrder[0] ?? 0);
  });
  it("does not report immediate login availability while hosted confirmation is still enabled", async () => {
    const { auth, run } = setup(false);
    await expect(run()).resolves.toEqual({ needsConfirmation: true });
    expect(auth.signOut).not.toHaveBeenCalled();
  });
  it("rejects duplicate registration errors", async () => {
    const { auth, run } = setup();
    auth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: new Error("User already registered") });
    await expect(run()).rejects.toThrow("already registered");
    expect(auth.signOut).not.toHaveBeenCalled();
  });
  it("rejects concealed duplicate account responses", async () => {
    const { auth, run } = setup(false);
    auth.signUp.mockResolvedValue({ data: { user: { identities: [] }, session: null }, error: null });
    await expect(run()).rejects.toThrow("already exists");
  });
});