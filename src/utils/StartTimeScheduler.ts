export class StartTimeScheduler {
  async waitUntil(startTime: string): Promise<void> {
    const targetTime = new Date(startTime).getTime();

    if (Number.isNaN(targetTime)) {
      throw new Error(`[Scheduler] Invalid start time: ${startTime}`);
    }

    if (targetTime <= Date.now()) {
      throw new Error(
        "[Scheduler] Start time must be in the future",
      );
    }

    console.log("[Scheduler] Waiting for scheduled start time");

    while (true) {
      const remainingMs = targetTime - Date.now();

      if (remainingMs <= 0) {
        break;
      }

      const totalSeconds = Math.ceil(remainingMs / 1_000);

      const hours = Math.floor(totalSeconds / 3_600);
      const minutes = Math.floor((totalSeconds % 3_600) / 60);
      const seconds = totalSeconds % 60;

      const countdown = [hours, minutes, seconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":");

      process.stdout.write(
        `\r[Scheduler] Starting in ${countdown} `,
      );

      await new Promise<void>((resolve) => {
        setTimeout(resolve, Math.min(1_000, remainingMs));
      });
    }

    console.log("\n[Scheduler] Start time reached!");
  }
}