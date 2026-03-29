import { Database } from "bun:sqlite";
import { join } from "path";
import { homedir } from "os";
import { mkdirSync } from "fs";
import { SIDECAR_PORT } from "@castlight/shared";
import { runMigrations } from "./db/migrate";
import { createApp } from "./server";
import { publishService } from "./mdns/discovery";

const dataDir = join(homedir(), ".castlight");
mkdirSync(dataDir, { recursive: true });

const db = new Database(join(dataDir, "castlight.db"));
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
runMigrations(db);

const biblesDir = join(import.meta.dir, "../../../assets/bibles");
const mediaDir = join(dataDir, "media");
const publicDir = join(import.meta.dir, "../public");

const { app, httpServer } = createApp({ db, biblesDir, mediaDir, publicDir });

// Mount Hono on the Node http server (same port for HTTP + WS)
httpServer.on("request", async (req, res) => {
  const url = `http://localhost:${SIDECAR_PORT}${req.url}`;
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers[key] = Array.isArray(value) ? value[0] : value;
  }

  const response = await app.fetch(new Request(url, {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req as any : undefined,
  }));

  res.writeHead(response.status, Object.fromEntries(response.headers));
  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
});

httpServer.listen(SIDECAR_PORT, () => {
  console.log(`[castlight] sidecar running on http://localhost:${SIDECAR_PORT}`);
  publishService(SIDECAR_PORT);
});

process.on("SIGINT", () => {
  db.close();
  httpServer.close();
  process.exit(0);
});
