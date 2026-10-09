import { test, expect } from "@playwright/test";

test("SHOULD disable refresh button during cooldown", async ({ page }) => {
  await page.goto("/?scenario=B&availableAfter=3");

  const refreshButton = page.getByRole("button", {
    name: "Muat Ulang Ketersediaan Tiket",
  });

  await expect(refreshButton).toBeEnabled();

  await refreshButton.click();

  await expect(refreshButton).toBeDisabled();

  await expect(
    page.locator("#cooldown-message"),
  ).toContainText("Please wait");

  await expect(refreshButton).toBeEnabled({
    timeout: 7_000,
  });
});