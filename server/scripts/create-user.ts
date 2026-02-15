/**
 * Create a Supabase Auth user. Run from repo root: npm run create-user
 * Optional: set CREATE_USER_PASSWORD in .env (otherwise a random password is generated and printed).
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const EMAIL = "nick.dataworks@gmail.com";

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

function generatePassword(): string {
  return randomBytes(16).toString("base64url").slice(0, 20);
}

async function main() {
  const password = process.env.CREATE_USER_PASSWORD ?? generatePassword();
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      console.log("User already exists:", EMAIL);
      const { data: list } = await supabase.auth.admin.listUsers();
      const user = list?.users?.find((u) => u.email === EMAIL);
      if (user) console.log("User id (for x-user-id):", user.id);
      return;
    }
    console.error("Error creating user:", error.message);
    process.exit(1);
  }

  console.log("User created:", EMAIL);
  console.log("User id (for x-user-id):", data.user?.id);
  if (!process.env.CREATE_USER_PASSWORD) {
    console.log("Generated password (save it):", password);
  }
}

main();
