import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Browser-safe client (anon key — respects RLS)
export const supabasePublic = createClient(url, anon);

// Server / script client (service-role — bypasses RLS)
export const supabase = createClient(url, svc ?? anon, {
  auth: { persistSession: false },
});
