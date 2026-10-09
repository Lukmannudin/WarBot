import { test, expect, type Page } from "@playwright/test";
import { TicketAvailabilityChecker } from "../src/automation/TicketAvailabilityChecker.js";
import { TicketSelector } from "../src/automation/TicketSelector.js";
import { QuantitySelector } from "../src/automation/QuantitySelector.js";
import { OrderFlowHandler } from "../src/automation/OrderFlowHandler.js";
import { CheckoutVerifier } from "../src/automation/CheckoutVerifier.js";

const TICKET_NAME = "Festival Presale 2";
const TICKET_QUANTITY = 3;
const TICKET_PRICE = 500_000;

async function prepareTicket(page: Page): Promise<void> {
  const availabilityChecker = new TicketAvailabilityChecker(page, {
    maxChecks: 5,
    refreshTimeoutMs: 15_000,
  });

  const result = await availabilityChecker.check(
    new AbortController().signal,
  );

  expect(result.available).toBe(true);

  const ticketSelector = new TicketSelector(page);
  const ticketCard = await ticketSelector.findTicket(TICKET_NAME);

  const quantitySelector = new QuantitySelector();

  await quantitySelector.selectQuantity(
    ticketCard,
    TICKET_QUANTITY,
  );
}

for (const scenario of ["A", "B", "C"] as const) {
  test(`SHOULD complete mock checkout WHEN scenario ${scenario}`, async ({
    page,
  }) => {
    await page.goto(`/?scenario=${scenario}&availableAfter=1`);

    await prepareTicket(page);

    const orderButton = page.getByRole("button", {
      name: /^(Order Now|Pesan Sekarang)$/i,
    });

    if (scenario === "C") {
      await expect(orderButton).toHaveText("Pesan Sekarang");
    } else {
      await expect(orderButton).toHaveText("Order Now");
    }

    const orderFlowHandler = new OrderFlowHandler(page, {
      agreementTimeoutMs: 10_000,
      checkoutTimeoutMs: 10_000,
    });

    if (scenario === "A") {
      const agreementHandler = page
        .getByRole("dialog", {
          name: "Ticket Purchase Agreement",
        })
        .waitFor({ state: "visible" })
        .then(async () => {
          await page.locator("#agreement-checkbox").check();

          await page.getByRole("button", {
            name: "Continue to Checkout",
          }).click();
        });

      const result = await orderFlowHandler.proceed(
        orderButton,
        new AbortController().signal,
      );

      await agreementHandler;

      expect(result.agreementShown).toBe(true);
    } else {
      const result = await orderFlowHandler.proceed(
        orderButton,
        new AbortController().signal,
      );

      expect(result.agreementShown).toBe(false);
    }

    const checkoutVerifier = new CheckoutVerifier(page);

    const verification = await checkoutVerifier.verify({
      ticketName: TICKET_NAME,
      quantity: TICKET_QUANTITY,
      ticketPrice: TICKET_PRICE,
    });

    expect(verification.ticketName).toBe(TICKET_NAME);
    expect(verification.quantity).toBe(TICKET_QUANTITY);
    expect(verification.total).toBe(1_500_000);
  });
}