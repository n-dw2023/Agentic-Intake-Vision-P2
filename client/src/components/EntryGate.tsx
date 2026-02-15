import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EntryGate() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const result = await login(email, password);
        if ("ok" in result && result.ok) {
          return;
        }
        setError("error" in result ? result.error : "Invalid email or password.");
      } finally {
        setLoading(false);
      }
    },
    [login, email, password]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-surface-app)]">
      <div className="w-full max-w-sm px-6">
        <h1 className="mb-2 text-[var(--font-size-title)] font-medium text-[var(--color-text-primary)]">
          Sign in to continue
        </h1>
        <p className="mb-6 text-[var(--font-size-secondary)] text-[var(--color-text-secondary)]">
          Use your Supabase Auth email and password.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoFocus
            autoComplete="email"
            id="entry-gate-email"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
            error={error ?? undefined}
            id="entry-gate-password"
          />
          <Button type="submit" disabled={loading} loading={loading}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
