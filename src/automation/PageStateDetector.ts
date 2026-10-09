import { type Page } from "playwright";

export type PageState =
    | "TICKET_SELECTION"
    | "CHECKOUT"
    | "AGREEMENT"
    | "NO_TICKETS"
    | "LOADING";

export class PageStateDetector {
    async detect(page: Page): Promise<PageState> {
        const checkout = page.getByText("Detail Pesanan", {
            exact: true,
        });

        if (await checkout.isVisible()) {
            return "CHECKOUT";
        }

        const ticketSelection = page.getByText("Pilih Tiket", {
            exact: true,
        });

        const ticketCards = page.locator("div.ticket h3");

        const refreshButton = page.getByRole("button", {
            name: "Muat Ulang Ketersediaan Tiket",
            exact: true,
        });

        if (
            (await ticketSelection.isVisible()) &&
            (await refreshButton.isVisible())
        ) {
            return "NO_TICKETS";
        }

        if (
            (await ticketSelection.isVisible()) &&
            (await ticketCards.count()) > 0
        ) {
            return "TICKET_SELECTION";
        }

        const agreement = page.getByRole("dialog");

        if (await agreement.isVisible()) {
            return "AGREEMENT";
        }

        return "LOADING";
    }

    async waitForReady(
        page: Page,
        timeoutMs = 15_000,
    ): Promise<PageState> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            const state = await this.detect(page);

            if (state !== "LOADING") {
                console.log(`[PageState] Detected: ${state}`);
                return state;
            }

            await page.waitForTimeout(500);
        }

        throw new Error(
            `[PageState] Unable to detect page state after ${timeoutMs}ms`,
        );
    }
}