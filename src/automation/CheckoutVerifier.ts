import type { Page } from "playwright";

export interface CheckoutExpectation {
  ticketName: string;
  quantity: number;
  ticketPrice: number;
}

export interface CheckoutVerificationResult {
  ticketName: string;
  quantity: number;
  total: number;
}

export class CheckoutVerifier {
  constructor(private readonly page: Page) {}

  async verify(
    expected: CheckoutExpectation,
  ): Promise<CheckoutVerificationResult> {
    console.log("[CheckoutVerifier] Verifying mock checkout");

    const checkout = this.page.locator("#checkout-section");

    await checkout.waitFor({
      state: "visible",
      timeout: 10_000,
    });

    const ticketName = (
      await checkout.locator("#checkout-ticket-name").innerText()
    ).trim();

    const quantityText = (
      await checkout.locator("#checkout-quantity").innerText()
    ).trim();

    const totalText = (
      await checkout.locator("#checkout-total").innerText()
    ).trim();

    const quantity = Number(quantityText);
    const total = this.parseCurrency(totalText);

    const expectedTotal = expected.quantity * expected.ticketPrice;

    if (ticketName !== expected.ticketName) {
      throw new Error(
        `Ticket mismatch. Expected "${expected.ticketName}", got "${ticketName}"`,
      );
    }

    if (!Number.isInteger(quantity) || quantity !== expected.quantity) {
      throw new Error(
        `Quantity mismatch. Expected ${expected.quantity}, got ${quantityText}`,
      );
    }

    if (total !== expectedTotal) {
      throw new Error(
        `Total mismatch. Expected Rp${expectedTotal}, got ${totalText}`,
      );
    }

    console.log(`[CheckoutVerifier] Ticket: ${ticketName}`);
    console.log(`[CheckoutVerifier] Quantity: ${quantity}`);
    console.log(
      `[CheckoutVerifier] Total: Rp${total.toLocaleString("id-ID")}`,
    );
    console.log("[CheckoutVerifier] Checkout verification passed");

    return {
      ticketName,
      quantity,
      total,
    };
  }

  private parseCurrency(value: string): number {
    const normalized = value
      .replace(/\s/g, "")
      .replace(/^Rp/i, "")
      .replace(/,00$/, "")
      .replace(/\./g, "");

    if (!/^\d+$/.test(normalized)) {
      throw new Error(
        `Unable to parse checkout total: ${value}`,
      );
    }

    const amount = Number(normalized);

    if (!Number.isSafeInteger(amount)) {
      throw new Error(
        `Invalid checkout total: ${value}`,
      );
    }

    return amount;
  }
}