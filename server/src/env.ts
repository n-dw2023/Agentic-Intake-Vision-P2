import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Repo root: server/src/env.ts -> ../../ = repo root
const repoRoot = resolve(__dirname, "..", "..");
// Load .env: repo root first (Supabase, OpenAI, etc.), then cwd
config({ path: resolve(repoRoot, ".env") });
config({ path: resolve(repoRoot, ".env.local") });
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), "..", ".env") });
config({ path: resolve(process.cwd(), "..", ".env.local") });

export function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export function getEnvOptional(name: string): string | undefined {
  return process.env[name];
}
