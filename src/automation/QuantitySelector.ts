import type { Locator } from "playwright";

export class QuantitySelector {
  async selectQuantity(
    ticketCard: Locator,
    quantity: number,
  ): Promise<void> {
    console.log(
      `[QuantitySelector] Selecting ${quantity} tickets`,
    );

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 3
    ) {
      throw new Error(
        `Invalid ticket quantity: ${quantity}`,
      );
    }

    const quantitySelector = ticketCard.getByRole(
      "combobox",
    );

    const selectorCount = await quantitySelector.count();

    if (selectorCount !== 1) {
      throw new Error(
        `Expected one quantity selector, found ${selectorCount}`,
      );
    }

    const selector = quantitySelector.first();

    await selector.waitFor({
      state: "visible",
      timeout: 10_000,
    });

    await selector.selectOption(String(quantity));

    const selectedValue = await selector.inputValue();

    if (selectedValue !== String(quantity)) {
      throw new Error(
        `Quantity verification failed. Expected ${quantity}, got ${selectedValue}`,
      );
    }

    console.log(
      `[QuantitySelector] Successfully selected ${quantity} tickets`,
    );
  }
}