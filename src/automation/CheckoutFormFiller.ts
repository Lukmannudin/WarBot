import { type Page } from "playwright";

export interface ParticipantData {
  fullName: string;
  nik: string;
  email: string;
}

export class CheckoutFormFiller {
  async fill(
    page: Page,
    participant: ParticipantData,
  ): Promise<void> {
    console.log("[Checkout] Waiting for participant form");

    await page.getByRole("tab", {
      name: "Pengunjung 1",
    }).click();

    const fullNameInput = page.locator('input[name="firstname"]');
    const nikInput = page.locator('input[name="identity_id"]');
    const emailInput = page.locator('input[name="email"]');

    await fullNameInput.waitFor({
      state: "visible",
      timeout: 30_000,
    });

    console.log("[Checkout] Filling participant 1");

    await fullNameInput.fill(participant.fullName);
    await nikInput.fill(participant.nik);
    await emailInput.fill(participant.email);

    console.log("[Checkout] Participant 1 filled");
    console.log("[Checkout] Payment remains manual");
  }
}