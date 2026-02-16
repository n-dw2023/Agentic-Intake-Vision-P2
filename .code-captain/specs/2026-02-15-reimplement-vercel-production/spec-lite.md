# Re-implement Vercel Production (lite)

> Spec: [spec.md](./spec.md) | Authority: [vercel-api-best-practices](../2026-02-15-vercel-api-best-practices/spec.md)

**Goal:** Production build works; SPA and `/api/*` routable; no 404s from routing or missing artifacts.

**Config:** vercel.json v2; `api/[[...path]].ts` + `includeFiles: ["api/server-dist/**"]`; `dist/**` static; routes: filesystem then `/(.*)` → `/index.html`.

**Handler:** /api/health and /api/routes in handler; rest → Express; optional path normalization and 503 on Express throw.

**Build:** shared → server → build:vercel-api → client → build:vercel; smoke:vercel checks dist/index.html and api/server-dist/index.js.

**Checklist (post-deploy):** Root = repo root, Output = blank; one function api/[[...path]]; / and /index.html load; /api/health and /api/routes return JSON; one real route (e.g. /api/study-projects) responds.
