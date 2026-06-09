export type SupabasePublicEnv = {
  url: string;
  publishableKey: string;
};

export function readSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function hasSupabasePublicEnv() {
  return readSupabasePublicEnv() !== null;
}

export function getSupabasePublicEnv() {
  const env = readSupabasePublicEnv();

  if (!env) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return env;
}
