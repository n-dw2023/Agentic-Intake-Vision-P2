# Technical: Re-implement Vercel Production

> Parent: [../spec.md](../spec.md)

## As-built alignment

| Item | Spec (best-practices) | Implementation |
|------|------------------------|----------------|
| API entry | Single catch-all `api/[[...path]].ts` | One file; no other .ts under api/ |
| Server bundle | Copied to api/server-dist at build; included in function | build:vercel-api; vercel.json `config.includeFiles: ["api/server-dist/**"]` |
| Static | dist/** at site root | build:vercel copies client/dist → dist; SPA fallback dest: "/index.html" |
| Health / routes | Handled in handler before Express | GET /api/health, GET /api/routes return JSON in handler |
| Express | Routes mounted at /api; req.url passed through | server/src/index.ts app.use("/api/..."); handler forwards unchanged |

## Production verification

See [Production Verification Checklist](../spec.md#production-verification-checklist) in the main spec. Run `npm run build && npm run smoke:vercel` locally before deploy.

## Common failure modes

- **404 on /api/*:** Root Directory not repo root; or Output Directory set in UI (overrides config); or api/server-dist not included in function (check includeFiles).
- **404 on / or SPA:** Fallback not `/index.html`; or client base not `/`; or dist/ not deployed.
- **Extra “functions” in Vercel:** Only `api/[[...path]].ts` should be a function; keep .d.ts and other non-runtime files outside api/.
