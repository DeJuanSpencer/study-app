import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const projectId = process.env.STUDY_APP_PROJECT_ID;
const serviceRoleKey = process.env.STUDY_APP_SERVICE_ROLE_API_KEY;

let supabase: SupabaseClient | null = null;

if (projectId && serviceRoleKey) {
  supabase = createClient(
    `https://${projectId}.supabase.co`,
    serviceRoleKey,
    { auth: { persistSession: false } }
  );
}

export { supabase };
