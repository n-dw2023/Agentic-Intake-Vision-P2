# Development conventions

## Database migrations

- **Migrations live in** `supabase/migrations/` (SQL files, timestamped).
- **Apply migrations:** from repo root run `npm run db:migrate` (runs `supabase db push`).
- **Contract:** With the user’s approval, the agent may run the migration script when adding or changing migrations (e.g. after creating a new migration file or when the user reports a missing table). Do not run migrations that drop data or alter production without explicit approval.
