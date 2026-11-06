import type { SupabaseClient, User } from "@supabase/supabase-js";

export function isEmailVerified(user: Pick<User, "email_confirmed_at"> | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at);
}

export function verificationRedirect(origin: string): string {
  return new URL("/auth/callback", origin).href;
}

/** Uses the existing client; no parallel session store or auth listener. */
export async function completeEmailVerification(auth: SupabaseClient["auth"], href: string) {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.slice(1));
  if (url.searchParams.has("error") || hash.has("error") || url.searchParams.has("error_code") || hash.has("error_code")) {
    throw new Error("This verification link has expired or is invalid. Request a new email below.");
  }

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") ?? hash.get("type");
  if (type && type !== "signup" && type !== "email") {
    throw new Error("This is not an email verification link. Request a new verification email below.");
  }

  // Wait for the client's initial URL/session processing before manual exchanges.
  const initial = await auth.getSession();
  if (code) {
    const { error } = await auth.exchangeCodeForSession(code);
    if (error) throw error;
  } else if (tokenHash) {
    if (type !== "signup" && type !== "email") throw new Error("This verification link is incomplete.");
    const { error } = await auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) throw error;
  } else if (hash.has("access_token") || hash.has("refresh_token")) {
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if (!accessToken || !refreshToken) throw new Error("This verification link is incomplete.");
    const { error } = await auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw error;
  } else if (initial.error) {
    throw initial.error;
  }

  const { data: sessionData, error: sessionError } = await auth.getSession();
  if (sessionError || !sessionData.session) throw new Error("This verification link has expired or is invalid.");
  const { data, error } = await auth.getUser();
  if (error) throw error;
  if (!isEmailVerified(data.user)) throw new Error("Your email is not verified yet. Request a new verification email below.");
  return data.user;
}