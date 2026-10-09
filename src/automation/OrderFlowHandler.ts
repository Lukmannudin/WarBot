import type { Locator, Page } from "playwright";

export interface OrderFlowOptions {
  agreementTimeoutMs: number;
  checkoutTimeoutMs: number;
}

export interface OrderFlowResult {
  agreementShown: boolean;
  checkoutReached: boolean;
}

export class OrderFlowHandler {
  constructor(
    private readonly page: Page,
    private readonly options: OrderFlowOptions,
  ) {}

  async proceed(
    orderButton: Locator,
    signal: AbortSignal,
  ): Promise<OrderFlowResult> {
    this.throwIfCancelled(signal);

    console.log("[OrderFlow] Clicking order button");

    await orderButton.click();

    this.throwIfCancelled(signal);

    const agreementModal = this.page.locator("#agreement-modal");
    const checkoutSection = this.page.locator("#checkout-section");

    const outcome = await Promise.race([
      agreementModal
        .waitFor({
          state: "visible",
          timeout: this.options.checkoutTimeoutMs,
        })
        .then(() => "agreement" as const),
      checkoutSection
        .waitFor({
          state: "visible",
          timeout: this.options.checkoutTimeoutMs,
        })
        .then(() => "checkout" as const),
    ]);

    this.throwIfCancelled(signal);

    if (outcome === "checkout") {
      console.log(
        "[OrderFlow] Checkout reached without agreement",
      );

      return {
        agreementShown: false,
        checkoutReached: true,
      };
    }

    console.log(
      "[OrderFlow] Agreement popup detected",
    );

    console.log(
      "[OrderFlow] Please accept the agreement manually in Chromium",
    );

    await agreementModal.waitFor({
      state: "hidden",
      timeout: this.options.agreementTimeoutMs,
    });

    this.throwIfCancelled(signal);

    await checkoutSection.waitFor({
      state: "visible",
      timeout: this.options.checkoutTimeoutMs,
    });

    console.log(
      "[OrderFlow] Checkout reached after agreement",
    );

    return {
      agreementShown: true,
      checkoutReached: true,
    };
  }

  private throwIfCancelled(signal: AbortSignal): void {
    if (signal.aborted) {
      throw new Error("Operation cancelled");
    }
  }
}