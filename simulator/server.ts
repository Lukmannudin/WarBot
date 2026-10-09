import { createServer, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PORT = 3000;

const PUBLIC_DIRECTORY = fileURLToPath(
  new URL("./public/", import.meta.url),
);

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const ROUTES: Record<string, string> = {
  "/": "index.html",
  "/index.html": "index.html",
  "/styles.css": "styles.css",
  "/app.js": "app.js",
};

function sendError(
  response: ServerResponse,
  statusCode: number,
  message: string,
): void {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
  });

  response.end(message);
}

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`,
    ).pathname;

    const filename = ROUTES[pathname];

    if (!filename) {
      sendError(response, 404, "Page not found");
      return;
    }

    const filePath = path.join(PUBLIC_DIRECTORY, filename);
    const content = await readFile(filePath);

    const extension = path.extname(filePath);

    response.writeHead(200, {
      "Content-Type":
        CONTENT_TYPES[extension] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });

    response.end(content);
  } catch (error: unknown) {
    console.error("[Simulator] Request failed:", error);

    sendError(response, 500, "Internal server error");
  }
});

server.on("error", (error: Error) => {
  console.error("[Simulator] Server failed:", error);
  process.exitCode = 1;
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("========================================");
  console.log("       TICKET WAR BOT SIMULATOR");
  console.log("========================================");
  console.log("");
  console.log(`Simulator: http://localhost:${PORT}`);
  console.log("");
  console.log("Press Ctrl+C to stop the server.");
});

function shutdown(): void {
  console.log("\n[Simulator] Shutting down...");

  server.close((error) => {
    if (error) {
      console.error("[Simulator] Shutdown failed:", error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);