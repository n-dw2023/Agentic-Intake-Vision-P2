/**
 * Type declaration for the compiled Express app copied into api/server-dist by build:vercel-api.
 * The actual files are generated at build time (server/dist → api/server-dist).
 * Lives under server/types/ so Vercel does not treat it as an API function.
 */
declare module "./server-dist/index.js" {
  import type { IncomingMessage, ServerResponse } from "http";
  const app: (req: IncomingMessage, res: ServerResponse) => void;
  export { app };
}
