import { test, expect } from "@playwright/test";
import { CheckoutVerifier } from "../src/automation/CheckoutVerifier.js";

test.describe("CheckoutVerifier", () => {
  test("SHOULD reject incorrect ticket quantity", async ({ page }) => {
    await page.goto("/?scenario=B&availableAfter=1");

    await page.evaluate(() => {
      const checkout = document.getElementById("checkout-section");
      const quantity = document.getElementById("checkout-quantity");
      const total = document.getElementById("checkout-total");

      if (!checkout || !quantity || !total) {
        throw new Error("Mock checkout elements not found");
      }

      checkout.hidden = false;
      quantity.textContent = "2";
      total.textContent = "Rp1.500.000";
    });

    const verifier = new CheckoutVerifier(page);

    await expect(
      verifier.verify({
        ticketName: "Festival Presale 2",
        quantity: 3,
        ticketPrice: 500_000,
      }),
    ).rejects.toThrow("Quantity mismatch");
  });

  test("SHOULD reject incorrect total price", async ({ page }) => {
    await page.goto("/?scenario=B&availableAfter=1");

    await page.evaluate(() => {
      const checkout = document.getElementById("checkout-section");
      const quantity = document.getElementById("checkout-quantity");
      const total = document.getElementById("checkout-total");

      if (!checkout || !quantity || !total) {
        throw new Error("Mock checkout elements not found");
      }

      checkout.hidden = false;
      quantity.textContent = "3";
      total.textContent = "Rp1.800.000";
    });

    const verifier = new CheckoutVerifier(page);

    await expect(
      verifier.verify({
        ticketName: "Festival Presale 2",
        quantity: 3,
        ticketPrice: 500_000,
      }),
    ).rejects.toThrow("Total mismatch");
  });

  test("SHOULD reject incorrect ticket category", async ({ page }) => {
    await page.goto("/?scenario=B&availableAfter=1");

    await page.evaluate(() => {
      const checkout = document.getElementById("checkout-section");
      const ticketName = document.getElementById("checkout-ticket-name");
      const quantity = document.getElementById("checkout-quantity");
      const total = document.getElementById("checkout-total");

      if (!checkout || !ticketName || !quantity || !total) {
        throw new Error("Mock checkout elements not found");
      }

      checkout.hidden = false;
      ticketName.textContent = "Festival Presale 1";
      quantity.textContent = "3";
      total.textContent = "Rp1.500.000";
    });

    const verifier = new CheckoutVerifier(page);

    await expect(
      verifier.verify({
        ticketName: "Festival Presale 2",
        quantity: 3,
        ticketPrice: 500_000,
      }),
    ).rejects.toThrow("Ticket mismatch");
  });
});