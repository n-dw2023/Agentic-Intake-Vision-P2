/**
 * Local dev entry: start the Express server. Vercel uses the app via api/index.ts instead.
 */
import { app, PORT } from "./index.js";

app.listen(Number(PORT), () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
