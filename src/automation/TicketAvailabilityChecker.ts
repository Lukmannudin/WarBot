import type { Page } from "playwright";

export interface AvailabilityCheckResult {
  available: boolean;
  checksPerformed: number;
}

export interface AvailabilityCheckerOptions {
  maxChecks: number;
  refreshTimeoutMs: number;
}

export class TicketAvailabilityChecker {
  constructor(
    private readonly page: Page,
    private readonly options: AvailabilityCheckerOptions,
  ) {}

  async check(
    signal?: AbortSignal,
  ): Promise<AvailabilityCheckResult> {
    const ticketHeading = this.page.getByRole("heading", {
      name: "Festival Presale 2",
      exact: true,
    });

    await ticketHeading.waitFor({
      state: "visible",
      timeout: 10_000,
    });

    const availabilityBadge = this.page.locator(
      "#availability-badge",
    );

    const refreshButton = this.page.getByRole("button", {
      name: "Muat Ulang Ketersediaan Tiket",
      exact: true,
    });

    let checksPerformed = 0;

    while (checksPerformed < this.options.maxChecks) {
      this.throwIfCancelled(signal);

      const status = (
        await availabilityBadge.textContent()
      )?.trim();

      if (status === "Available") {
        return {
          available: true,
          checksPerformed,
        };
      }

      if (status !== "Unavailable") {
        throw new Error(
          `Unexpected availability status: ${status}`,
        );
      }

      console.log(
        `[Availability] Tickets unavailable. Check ${checksPerformed + 1}/${this.options.maxChecks}`,
      );

      await refreshButton.waitFor({
        state: "visible",
        timeout: 10_000,
      });

      await refreshButton.click({
        timeout: this.options.refreshTimeoutMs,
      });

      checksPerformed += 1;

      console.log(
        `[Availability] Refresh completed. Total checks: ${checksPerformed}`,
      );

      const updatedStatus = (
        await availabilityBadge.textContent()
      )?.trim();

      if (updatedStatus === "Available") {
        return {
          available: true,
          checksPerformed,
        };
      }

      if (updatedStatus !== "Unavailable") {
        throw new Error(
          `Unexpected availability status: ${updatedStatus}`,
        );
      }

      if (checksPerformed >= this.options.maxChecks) {
        break;
      }

      console.log(
        "[Availability] Waiting for refresh cooldown...",
      );

      await refreshButton.waitFor({
        state: "visible",
        timeout: this.options.refreshTimeoutMs,
      });

      await this.waitUntilRefreshEnabled(
        refreshButton,
        signal,
      );
    }

    return {
      available: false,
      checksPerformed,
    };
  }

  private async waitUntilRefreshEnabled(
    refreshButton: ReturnType<Page["getByRole"]>,
    signal?: AbortSignal,
  ): Promise<void> {
    const startedAt = Date.now();

    while (
      Date.now() - startedAt <
      this.options.refreshTimeoutMs
    ) {
      this.throwIfCancelled(signal);

      if (await refreshButton.isEnabled()) {
        console.log(
          "[Availability] Refresh button is enabled",
        );

        return;
      }

      await this.sleep(200, signal);
    }

    throw new Error(
      "Timed out waiting for availability refresh cooldown",
    );
  }

  private async sleep(
    milliseconds: number,
    signal?: AbortSignal,
  ): Promise<void> {
    this.throwIfCancelled(signal);

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, milliseconds);

      const onAbort = (): void => {
        clearTimeout(timer);
        reject(new Error("Operation cancelled"));
      };

      signal?.addEventListener("abort", onAbort, {
        once: true,
      });
    });
  }

  private throwIfCancelled(
    signal?: AbortSignal,
  ): void {
    if (signal?.aborted) {
      throw new Error("Operation cancelled");
    }
  }
}