/**
 * Set the password for a Supabase Auth user (service role required).
 * Run from repo root: npx tsx server/scripts/set-auth-password.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const AUTH_USER_ID = "02cf1a07-7c3d-438a-852f-39e8ffd31485";
const NEW_PASSWORD = "123_Nick_456!";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), "..", ".env") });
config({ path: resolve(process.cwd(), "..", ".env.local") });

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

async function main() {
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.updateUserById(AUTH_USER_ID, {
    password: NEW_PASSWORD,
  });

  if (error) {
    console.error("Error updating password:", error.message);
    process.exit(1);
  }

  console.log("Password updated for user:", data.user?.email ?? AUTH_USER_ID);
  console.log("Sign in with this password in the app.");
}

main();
