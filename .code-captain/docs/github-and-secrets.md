# GitHub and Protecting Secrets

Use this when connecting this project to GitHub and whenever you add new env vars or deploy.

## Repo

**GitHub:** [n-dw2023/Agentic-Intake-Vision-P2](https://github.com/n-dw2023/Agentic-Intake-Vision-P2)

## Never commit these

- **`.env`** — Local env (Supabase, OpenAI, `APP_ENTRY_PASSWORD`, etc.)
- **`.env.local`**, **`.env.development`**, **`.env.production`**, any **`.env.*.local`**
- **Keys/certs**: `*.pem`, `*.key`, `.secret`, `.secrets`
- **Real values** in **`.env.example`** — keep it as a template with placeholders only

The only env file that should be in the repo is **`.env.example`** (no real keys, no real passwords).

## .gitignore

The repo `.gitignore` already excludes:

- `.env`, `.env.local`, `.env.*.local`
- `.env.development`, `.env.production`, and their `.local` variants
- `*.pem`, `*.key`, `.secret`, `.secrets`

Before your first push (and before any push), double-check:

```bash
git status
# Ensure .env and .env.local do NOT appear
git check-ignore -v .env .env.local
# Should say "Ignored by .gitignore"
```

## Connecting this project to GitHub

This project is intended to be its own Git repo, pushed to:

**https://github.com/n-dw2023/Agentic-Intake-Vision-P2**

### First-time setup (from Agent-Config directory)

```bash
cd /Users/nick/Agent-Config
git init
git add .
git status   # confirm no .env, .env.local, or other secrets
git commit -m "Initial commit: Agent Config (Agentic Intake Vision P2)"
git remote add origin https://github.com/n-dw2023/Agentic-Intake-Vision-P2.git
git branch -M main
git push -u origin main
```

Use SSH if you prefer: `git@github.com:n-dw2023/Agentic-Intake-Vision-P2.git`.

### Optional: pre-commit hook (block accidental .env commit)

```bash
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

### After push

- **Collaborators:** Clone the repo and create their own `.env` from `.env.example`; never commit `.env`.
- **CI/CD (later):** Use [GitHub Actions secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) for `OPENAI_API_KEY`, `SUPABASE_*`, `APP_ENTRY_PASSWORD`, etc.

## Env vars this project uses

| Variable | Used by | Purpose |
|----------|---------|---------|
| `OPENAI_API_KEY` | server | Workflow generation |
| `SUPABASE_URL` | server | Supabase project URL |
| `SUPABASE_ANON_KEY` | server | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Supabase service role (privileged) |
| `APP_ENTRY_PASSWORD` | server | Entry gate password |
| `PORT` | server | Optional; default 3000 |
| `VITE_USER_ID` | client (build) | Optional; dev user for x-user-id |

`VITE_*` is baked into the client bundle at build time — use only for non-secret, public config. Do not put secrets in `VITE_*`.
