import { WebsiteInspector } from "./inspection/WebsiteInspector.js";

async function main(): Promise<void> {
  const inspector = new WebsiteInspector();

  await inspector.inspect();
}

main().catch((error: unknown) => {
  console.error("[Inspector] Failed:", error);

  process.exitCode = 1;
});