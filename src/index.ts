import { TicketBot } from "./bot/TicketBot.js";

const scenario = (
  process.env.SIMULATOR_SCENARIO ?? "A"
).toUpperCase();

if (!["A", "B", "C"].includes(scenario)) {
  throw new Error(
    `Invalid SIMULATOR_SCENARIO: ${scenario}. Expected A, B, or C.`,
  );
}

const simulatorUrl = new URL("http://127.0.0.1:3000");

simulatorUrl.searchParams.set("scenario", scenario);

const bot = new TicketBot({
  simulatorUrl: simulatorUrl.toString(),
  ticketName: "Festival Presale 2",
  quantity: 3,
  ticketPrice: 600_000,
  maxChecks: 10,
  refreshTimeoutMs: 15_000,
});

process.once("SIGINT", () => {
  console.log("\n[Application] Ctrl+C received");
  bot.cancel();
});

process.once("SIGTERM", () => {
  console.log("\n[Application] Termination requested");
  bot.cancel();
});

async function main(): Promise<void> {
  console.log("========================================");
  console.log("           TICKET WAR BOT");
  console.log("========================================");

  await bot.run();

  console.log("[Application] Finished");
}

main().catch((error: unknown) => {
  console.error("[Application] Failed:", error);

  process.exitCode = 1;
});