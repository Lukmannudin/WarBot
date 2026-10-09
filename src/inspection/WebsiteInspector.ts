import {
    chromium,
    type BrowserContext,
    type Locator,
    type Page,
} from "playwright";

import { PageStateDetector } from "../automation/PageStateDetector.js";
import { CheckoutFormFiller } from "../automation/CheckoutFormFiller.js";
import { RealQuantitySelector } from "../automation/RealQuantitySelector.js";
import { participant } from "../config/participant.js";
import { botConfig } from "../config/bot.config.js";

const BROWSER_PROFILE_PATH = ".browser-profile";

const PAGE_TIMEOUT_MS = 30_000;
const PURCHASE_BUTTON_TIMEOUT_MS = 20_000;
const NAVIGATION_TIMEOUT_MS = 15_000;
const CHECKOUT_TIMEOUT_MS = 30_000;

export class WebsiteInspector {
    async inspect(): Promise<void> {
        console.log("========================================");
        console.log("            LOKET TICKET BOT");
        console.log("========================================");

        const context = await chromium.launchPersistentContext(
            BROWSER_PROFILE_PATH,
            {
                headless: false,
                viewport: {
                    width: 1440,
                    height: 900,
                },
            },
        );

        try {
            const page = context.pages()[0] ?? await context.newPage();

            await this.openEvent(page);

            await this.waitForCookieConsent(page);

            const buyButton = await this.findBuyTicketButton(page);

            if (!buyButton) {
                console.log(
                    "[Bot] Beli Tiket is unavailable or disabled",
                );
                return;
            }

            console.log("[Bot] Clicking Beli Tiket");

            const ticketPage = await this.openTicketSelection(
                context,
                page,
                buyButton,
            );

            await this.processTicketPage(ticketPage);
        } finally {
            console.log("\n[Bot] Press Enter to close browser");

            await this.waitForEnter();

            await context.close();

            console.log("[Bot] Browser closed");
        }
    }

    private async openEvent(page: Page): Promise<void> {
        console.log(`[Bot] Opening event: ${botConfig.eventUrl}`);

        await page.goto(botConfig.eventUrl, {
            waitUntil: "domcontentloaded",
            timeout: PAGE_TIMEOUT_MS,
        });

        console.log(`[Bot] Current URL: ${page.url()}`);
    }

    private async processTicketPage(page: Page): Promise<void> {
        console.log("[Bot] Waiting for ticket page");

        const pageStateDetector = new PageStateDetector();

        let pageState = await pageStateDetector.waitForReady(
            page,
            15_000,
        );

        console.log(`[Bot] Page state: ${pageState}`);

        if (pageState === "CHECKOUT") {
            console.log("[Bot] Existing checkout detected");

            await this.fillCheckout(page);

            return;
        }

        if (pageState === "NO_TICKETS") {
            await this.refreshTicketAvailability(page);

            const ticketCards = page.locator("div.ticket h3");

            if (await ticketCards.count() > 0) {
                pageState = "TICKET_SELECTION";
            }
        }

        if (pageState !== "TICKET_SELECTION") {
            console.log(
                `[Bot] Cannot continue from page state: ${pageState}`,
            );
            return;
        }

        await this.selectTickets(page);

        await this.navigateToCheckout(page);

        await this.fillCheckout(page);
    }

    private async selectTickets(page: Page): Promise<void> {
        console.log(
            `[Bot] Selecting ${botConfig.quantity} tickets for ${botConfig.ticketCategory}`,
        );

        const quantitySelector = new RealQuantitySelector();

        await quantitySelector.select(
            page,
            botConfig.ticketCategory,
            botConfig.quantity,
        );

        console.log("[Bot] Ticket quantity selected");
    }

    private async navigateToCheckout(page: Page): Promise<void> {
        console.log("[Bot] Preparing to order tickets");

        const orderButton = page.getByRole("button", {
            name: "Pesan Sekarang",
            exact: true,
        });

        await orderButton.waitFor({
            state: "visible",
            timeout: 15_000,
        });

        if (!(await orderButton.isEnabled())) {
            throw new Error(
                "[Bot] Pesan Sekarang is disabled after selecting tickets",
            );
        }

        console.log("[Bot] Clicking Pesan Sekarang automatically");

        await orderButton.click();

        await page.getByText("Detail Pesanan", {
            exact: true,
        }).waitFor({
            state: "visible",
            timeout: CHECKOUT_TIMEOUT_MS,
        });

        console.log("[Bot] Checkout reached");
    }

    private async fillCheckout(page: Page): Promise<void> {
        console.log("[Bot] Waiting for checkout form");

        await page.locator('input[name="firstname"]').first().waitFor({
            state: "visible",
            timeout: CHECKOUT_TIMEOUT_MS,
        });

        const checkoutFormFiller = new CheckoutFormFiller();

        await checkoutFormFiller.fill(page, participant);

        console.log("[Bot] Participant information filled");
        console.log("[Bot] Complete the remaining fields manually");
        console.log("[Bot] Payment remains manual");
    }

    private async refreshTicketAvailability(page: Page): Promise<void> {
        console.log("[Bot] Ticket categories not visible");

        const refreshButton = page.getByRole("button", {
            name: "Muat Ulang Ketersediaan Tiket",
            exact: true,
        });

        if (!(await refreshButton.isEnabled())) {
            console.log(
                "[Bot] Refresh unavailable, respecting website cooldown",
            );
            return;
        }

        console.log("[Bot] Refreshing ticket availability");

        await refreshButton.click();

        try {
            await page.locator("div.ticket h3").first().waitFor({
                state: "visible",
                timeout: 10_000,
            });

            console.log("[Bot] Ticket categories loaded");
        } catch {
            console.log(
                "[Bot] Ticket categories are still unavailable",
            );
        }
    }

    private async waitForCookieConsent(page: Page): Promise<void> {
        const consentText = page.getByText(
            /Kami menghargai privasi Anda/i,
        );

        try {
            await consentText.first().waitFor({
                state: "visible",
                timeout: 3_000,
            });

            console.log("[Bot] Cookie consent detected");
            console.log(
                "[Bot] Please choose your cookie preference manually",
            );

            await consentText.first().waitFor({
                state: "hidden",
                timeout: 120_000,
            });
        } catch {
            console.log("[Bot] Cookie consent not detected or dismissed");
        }
    }

    private async findBuyTicketButton(
        page: Page,
    ): Promise<Locator | null> {
        console.log("[Bot] Looking for Beli Tiket");

        const buttons = page.getByRole("button", {
            name: "Beli Tiket",
            exact: true,
        });

        try {
            await buttons.first().waitFor({
                state: "attached",
                timeout: PURCHASE_BUTTON_TIMEOUT_MS,
            });
        } catch {
            return null;
        }

        const count = await buttons.count();

        for (let index = 0; index < count; index++) {
            const button = buttons.nth(index);

            if (
                await button.isVisible() &&
                await button.isEnabled()
            ) {
                console.log("[Bot] Beli Tiket is ready");

                return button;
            }
        }

        return null;
    }

    private async openTicketSelection(
        context: BrowserContext,
        page: Page,
        buyButton: Locator,
    ): Promise<Page> {
        const existingPages = new Set(context.pages());

        await buyButton.click();

        console.log("[Bot] Waiting for ticket selection");

        try {
            await page.waitForURL(
                (url) => url.toString() !== botConfig.eventUrl,
                {
                    timeout: NAVIGATION_TIMEOUT_MS,
                },
            );

            console.log("[Bot] Ticket page opened in current tab");

            return page;
        } catch {
            const newPages = context.pages().filter(
                (candidate) => !existingPages.has(candidate),
            );

            if (newPages.length > 0) {
                const newPage = newPages[0]!;

                await newPage.waitForLoadState("domcontentloaded", {
                    timeout: NAVIGATION_TIMEOUT_MS,
                });

                console.log("[Bot] Ticket page opened in new tab");

                return newPage;
            }

            console.log(
                "[Bot] No navigation detected, checking current page",
            );

            return page;
        }
    }

    private async waitForEnter(): Promise<void> {
        process.stdin.resume();

        await new Promise<void>((resolve) => {
            process.stdin.once("data", () => {
                process.stdin.pause();
                resolve();
            });
        });
    }
}