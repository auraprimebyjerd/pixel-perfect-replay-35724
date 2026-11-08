import type { SupabaseClient } from "@supabase/supabase-js";

/** Cloud Auth owns uniqueness and password validation; never look up private emails. */
export async function registerAccount(
  auth: SupabaseClient["auth"],
  credentials: { email: string; password: string; full_name: string; phone: string },
  emailRedirectTo: string,
  clearProtectedData: () => Promise<void>,
) {
  const { email, password, full_name, phone } = credentials;
  const { data, error } = await auth.signUp({
    email,
    password,
    options: { emailRedirectTo, data: { full_name, phone } },
  });
  if (error) throw error;
  if (data.user?.identities?.length === 0) {
    throw new Error("An account already exists for this email. Please sign in or reset your password.");
  }
  if (!data.session) return { needsConfirmation: true };
  // Auto-confirm signs users in; this app requires a separate credential login.
  await clearProtectedData();
  const { error: signOutError } = await auth.signOut();
  if (signOutError) throw signOutError;
  return { needsConfirmation: false };
}