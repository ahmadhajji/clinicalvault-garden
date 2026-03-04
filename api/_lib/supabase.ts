import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let serviceClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

export function getSupabaseServiceClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase service credentials are not configured.");
  }

  if (!serviceClient) {
    serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return serviceClient;
}

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseAnonClient(): SupabaseClient {
  if (!isSupabaseAuthConfigured()) {
    throw new Error("Supabase anon credentials are not configured.");
  }
  if (!anonClient) {
    anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  }
  return anonClient;
}
