import { createClient } from "@supabase/supabase-js";

const projectId = process.env.STUDY_APP_PROJECT_ID!;
const serviceRoleKey = process.env.STUDY_APP_SERVICE_ROLE_API_KEY!;

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
