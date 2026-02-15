import { config } from "dotenv";
import { resolve } from "path";

// Load .env: try cwd (e.g. repo root when running npm run dev from root), then parent (when cwd is server/)
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
