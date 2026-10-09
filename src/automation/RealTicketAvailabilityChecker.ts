import { type Page } from "playwright";

const REFRESH_COOLDOWN_MS = 5_000;
const MAX_REFRESH_ATTEMPTS = 12;

export class RealTicketAvailabilityChecker {
  async waitForTicket(
    page: Page,
    categoryName: string,
  ): Promise<boolean> {
    const refreshButton = page.getByRole("button", {
      name: "Muat Ulang Ketersediaan Tiket",
      exact: true,
    });

    const ticketHeading = page
      .locator("div.ticket h3")
      .filter({
        hasText: new RegExp(
          `^\\s*${this.escapeRegex(categoryName)}\\s*$`,
          "i",
        ),
      });

    for (
      let attempt = 1;
      attempt <= MAX_REFRESH_ATTEMPTS;
      attempt++
    ) {
      if (await ticketHeading.isVisible()) {
        console.log(
          `[Availability] ${categoryName} found`,
        );

        return true;
      }

      console.log(
        `[Availability] ${categoryName} not found (${attempt}/${MAX_REFRESH_ATTEMPTS})`,
      );

      if (attempt === MAX_REFRESH_ATTEMPTS) {
        break;
      }

      if (!(await refreshButton.isVisible())) {
        console.log(
          "[Availability] Refresh button not available",
        );

        break;
      }

      if (!(await refreshButton.isEnabled())) {
        console.log(
          "[Availability] Refresh button is disabled",
        );

        break;
      }

      console.log("[Availability] Refreshing ticket availability");

      await refreshButton.click();

      await page.waitForTimeout(REFRESH_COOLDOWN_MS);
    }

    console.log(
      `[Availability] ${categoryName} was not found`,
    );

    return false;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}