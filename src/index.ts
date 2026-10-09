import { WebsiteInspector } from "./inspection/WebsiteInspector.js";
import { botConfig } from "./config/bot.config.js";
import { StartTimeScheduler } from "./utils/StartTimeScheduler.js";

async function main(): Promise<void> {
  console.log("========================================");
  console.log("             TICKET WAR BOT");
  console.log("========================================");

  console.log(`[Bot] Event: ${botConfig.eventUrl}`);
  console.log(`[Bot] Category: ${botConfig.ticketCategory}`);
  console.log(`[Bot] Quantity: ${botConfig.quantity}`);
  console.log(`[Bot] Start time: ${botConfig.startTime}`);

  const scheduler = new StartTimeScheduler();

  await scheduler.waitUntil(botConfig.startTime);

  console.log("[Bot] Starting Loket automation");

  const inspector = new WebsiteInspector();

  await inspector.inspect();

  console.log("[Bot] Finished");
}

main().catch((error: unknown) => {
  console.error("[Application] Failed:", error);
  process.exitCode = 1;
});