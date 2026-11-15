import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://krlozgavfjdwtkyefmjf.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_G7sbNK8IWfq4bV3yylX7w_KvY1b25Q";

let client: SupabaseClient | undefined;

export const getSupabase = () =>
  client ||
  (client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  }));

export const getSession = () => getSupabase().auth.getSession();
export const signIn = (email: string, password: string) => getSupabase().auth.signInWithPassword({ email, password });
export const signUp = (email: string, password: string) => getSupabase().auth.signUp({ email, password });
export const signInWithGoogle = () =>
  getSupabase().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
export const resetPassword = (email: string) =>
  getSupabase().auth.resetPasswordForEmail(email, typeof window !== "undefined" ? { redirectTo: window.location.origin } : undefined);
export const signOut = () => getSupabase().auth.signOut();
export const onAuthStateChange = (callback: (event: string, session: { user: User } | null) => void) => getSupabase().auth.onAuthStateChange(callback);

export const authMessage = (message: string) => {
  const text = message.toLowerCase();
  if (text.includes("invalid login") || text.includes("invalid credentials")) return "That email or password is incorrect.";
  if (text.includes("already registered") || text.includes("already exists")) return "That email is already registered. Try signing in.";
  if (text.includes("password") && (text.includes("weak") || text.includes("6 character") || text.includes("8 character"))) return "Use a stronger password with at least 6 characters.";
  if (text.includes("email")) return "Enter a valid email address.";
  if (text.includes("network") || text.includes("fetch")) return "Network error. Check your connection and try again.";
  return message;
};
