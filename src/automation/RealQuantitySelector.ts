import { type Page } from "playwright";

export class RealQuantitySelector {
  async select(
    page: Page,
    categoryName: string,
    quantity: number,
  ): Promise<void> {
    console.log(
      `[Quantity] Selecting ${quantity} tickets for ${categoryName}`,
    );

    const ticketCard = page
      .locator("div.ticket")
      .filter({
        has: page.locator("h3").filter({
          hasText: new RegExp(
            `^\\s*${categoryName}\\s*$`,
            "i",
          ),
        }),
      });

    const quantityButton = ticketCard.locator(
      'button[aria-haspopup="menu"]',
    );

    await quantityButton.waitFor({
      state: "visible",
      timeout: 15_000,
    });

    const currentQuantity = (
      await quantityButton.innerText()
    ).trim();

    if (currentQuantity === String(quantity)) {
      console.log("[Quantity] Correct quantity already selected");
      return;
    }

    await quantityButton.click();

    const quantityOption = page
      .getByRole("menu")
      .getByRole("menuitem", {
        name: String(quantity),
        exact: true,
      });

    await quantityOption.click();

    console.log(`[Quantity] Selected ${quantity} tickets`);
  }
}