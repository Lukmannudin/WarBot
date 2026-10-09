import {
    chromium,
    type BrowserContext,
    type Locator,
    type Page,
} from "playwright";

const EVENT_URL =
    "https://www.loket.com/event/good-day-schoolicious-harmony-in-collaboration-vol-4-wlq";

const BROWSER_PROFILE_PATH = ".browser-profile";

const PAGE_TIMEOUT_MS = 30_000;
const PURCHASE_BUTTON_TIMEOUT_MS = 20_000;
const NAVIGATION_TIMEOUT_MS = 15_000;

export class WebsiteInspector {

    private async inspectVisitorNavigation(page: Page): Promise<void> {
        console.log("\n========== VISITOR NAVIGATION ==========");

        const visitors = await page.evaluate(() => {
            return Array.from(
                document.querySelectorAll(
                    "button, [role='tab'], [role='button']",
                ),
            )
                .filter((element) =>
                    /Pengunjung\s+\d+/i.test(
                        element.textContent?.trim() ?? "",
                    ),
                )
                .map((element) => ({
                    tag: element.tagName,
                    role: element.getAttribute("role"),
                    text: element.textContent?.trim(),
                    html: element.outerHTML.slice(0, 1_000),
                }));
        });

        console.log(
            `[Inspector] Found ${visitors.length} visitor controls`,
        );

        for (const visitor of visitors) {
            console.log(JSON.stringify(visitor, null, 2));
        }
    }

    private async inspectCheckoutForm(page: Page): Promise<void> {
        console.log("\n========== CHECKOUT FORM INSPECTION ==========");

        const fields = await page.locator(
            "input, textarea, select, [role='radio'], [role='checkbox']",
        ).evaluateAll((elements) =>
            elements.map((element) => ({
                tag: element.tagName,
                type: element.getAttribute("type"),
                name: element.getAttribute("name"),
                id: element.id,
                placeholder: element.getAttribute("placeholder"),
                ariaLabel: element.getAttribute("aria-label"),
                role: element.getAttribute("role"),
                required: element.hasAttribute("required"),
                outerHTML: element.outerHTML.slice(0, 500),
            })),
        );

        console.log(`[Inspector] Found ${fields.length} fields`);

        for (const field of fields) {
            console.log(JSON.stringify(field, null, 2));
        }
    }

    private async navigateToCheckout(page: Page): Promise<void> {
        console.log("\n========== CHECKOUT NAVIGATION ==========");

        const orderButton = page.getByRole("button", {
            name: "Pesan Sekarang",
            exact: true,
        });

        if (!(await orderButton.isEnabled())) {
            console.log("[Inspector] Order button is disabled");
            return;
        }

        console.log("[Inspector] Order button is ready");

        console.log(
            "[Inspector] Waiting for manual confirmation before ordering",
        );

        await this.waitForEnter();

        const previousUrl = page.url();

        console.log("[Inspector] Clicking Pesan Sekarang");

        await orderButton.click();

        await page.getByText("Detail Pesanan", {
            exact: true,
        }).waitFor({
            state: "visible",
            timeout: 15_000,
        });

        console.log(`[Inspector] Previous URL: ${previousUrl}`);
        console.log(`[Inspector] Current URL: ${page.url()}`);

        console.log("\n========== CHECKOUT STATE ==========");

        const bodyText = await page.locator("body").innerText();

        console.log(bodyText.slice(0, 3_000));

        const buttons = await page.getByRole("button").all();

        for (const button of buttons) {
            if (!(await button.isVisible())) {
                continue;
            }

            const text = (await button.innerText()).trim();

            console.log(
                `[Inspector] Button: ${text}, enabled=${await button.isEnabled()}`,
            );
        }

        await this.inspectCheckoutForm(page);
        await this.inspectVisitorNavigation(page);
    }

    private async inspectOrderButton(page: Page): Promise<void> {
        console.log("\n========== ORDER BUTTON ==========");

        const orderButton = page.getByRole("button", {
            name: "Pesan Sekarang",
            exact: true,
        });

        await orderButton.waitFor({
            state: "visible",
            timeout: 15_000,
        });

        const enabled = await orderButton.isEnabled();

        console.log(`[Inspector] Order button enabled: ${enabled}`);

        if (!enabled) {
            console.log(
                "[Inspector] Cannot continue because no tickets are selected",
            );
            return;
        }

        console.log("[Inspector] Order button is ready");

        // Do not submit an order during inspection.
    }

    private async inspectQuantityDropdown(page: Page): Promise<void> {
        console.log("\n========== QUANTITY DROPDOWN ==========");

        const quantityButtons = page.locator(
            'div.ticket button[aria-haspopup="menu"]',
        );

        const count = await quantityButtons.count();

        console.log(`[Inspector] Found ${count} quantity dropdowns`);

        if (count === 0) {
            console.log("[Inspector] No quantity dropdown found");
            return;
        }

        const quantityButton = quantityButtons.first();

        console.log(
            `[Inspector] Current quantity: ${(await quantityButton.innerText()).trim()}`,
        );

        await quantityButton.click();

        console.log("[Inspector] Quantity dropdown opened");

        const menu = page.getByRole("menu");

        try {
            await menu.waitFor({
                state: "visible",
                timeout: 5_000,
            });
        } catch {
            console.log("[Inspector] Menu role not detected");
        }

        const dropdownElements = await page.evaluate(() => {
            const elements = Array.from(
                document.querySelectorAll(
                    "[role='menu'], [role='menuitem'], [role='option'], [data-radix-menu-content]",
                ),
            );

            return elements.map((element) => ({
                tag: element.tagName,
                role: element.getAttribute("role"),
                text: element.textContent?.trim(),
                html: element.outerHTML.slice(0, 1_000),
            }));
        });

        console.log(
            `[Inspector] Found ${dropdownElements.length} dropdown elements`,
        );

        for (const element of dropdownElements) {
            console.log(JSON.stringify(element, null, 2));
        }

        await page.keyboard.press("Escape");

        console.log("[Inspector] Quantity dropdown closed");
    }

    private async inspectTicketCards(page: Page): Promise<void> {
        console.log("\n========== TICKET CARDS ==========");

        const result = await page.evaluate(() => {
            const elements = Array.from(
                document.querySelectorAll(
                    "article, [class*='ticket'], [class*='Ticket']",
                ),
            );

            return elements
                .filter((element) => {
                    const text = element.textContent?.trim() ?? "";

                    return text.length > 0;
                })
                .slice(0, 20)
                .map((element) => ({
                    tag: element.tagName,
                    text: element.textContent?.trim().slice(0, 500),
                    html: element.outerHTML.slice(0, 1_500),
                }));
        });

        console.log(`[Inspector] Found ${result.length} candidates`);

        for (const element of result) {
            console.log(JSON.stringify(element, null, 2));
        }
    }
    private async inspectTicketControls(page: Page): Promise<void> {
        console.log("\n========== TICKET CONTROLS ==========");

        const result = await page.evaluate(() => {
            const elements = Array.from(
                document.querySelectorAll(
                    "button, input, select, [role='button'], [role='spinbutton'], [role='combobox']",
                ),
            );

            return elements.map((element) => {
                const htmlElement = element as HTMLElement;

                return {
                    tag: element.tagName,
                    text: (htmlElement.innerText ?? "").trim(),
                    ariaLabel: element.getAttribute("aria-label"),
                    role: element.getAttribute("role"),
                    disabled:
                        element.hasAttribute("disabled") ||
                        element.getAttribute("aria-disabled") === "true",
                    html: element.outerHTML.slice(0, 800),
                };
            });
        });

        console.log(
            `[Inspector] Found ${result.length} interactive elements`,
        );

        for (const element of result) {
            console.log(JSON.stringify(element, null, 2));
        }
    }
    private async waitForTicketPageReady(page: Page): Promise<void> {
        console.log("[Inspector] Waiting for Orion page to render");

        await page.waitForLoadState("domcontentloaded");

        await page.getByRole("button", {
            name: "Pesan Sekarang",
        }).waitFor({
            state: "visible",
            timeout: 30_000,
        });

        console.log("[Inspector] Orion page rendered");

        console.log("[Inspector] Waiting for ticket cards");

        try {
            await page.locator("div.ticket h3").first().waitFor({
                state: "visible",
                timeout: 15_000,
            });

            console.log("[Inspector] Ticket cards detected");
        } catch {
            console.log(
                "[Inspector] No ticket cards detected within 15 seconds",
            );

            console.log(
                "[Inspector] Ticket availability may be empty or still loading",
            );
        }

        const ticketCount = await page.locator("div.ticket h3").count();

        const bodyLength = await page
            .locator("body")
            .innerText()
            .then((text) => text.length);

        console.log(`[Inspector] Ticket categories: ${ticketCount}`);
        console.log(`[Inspector] Body length: ${bodyLength}`);
    }

    async inspect(): Promise<void> {
        console.log("========================================");
        console.log("       LOKET WEBSITE INSPECTOR");
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
            const page = context.pages()[0] ?? (await context.newPage());

            console.log("\n[Inspector] Opening event page");

            await page.goto(EVENT_URL, {
                waitUntil: "domcontentloaded",
                timeout: PAGE_TIMEOUT_MS,
            });

            console.log(`[Inspector] URL: ${page.url()}`);
            console.log(`[Inspector] Title: ${await page.title()}`);

            await this.waitForCookieConsent(page);

            console.log("\n[Inspector] Looking for Beli Tiket");

            const buyButton = await this.findBuyTicketButton(page);

            if (!buyButton) {
                console.log(
                    "[Inspector] No visible and enabled Beli Tiket button found",
                );

                return;
            }

            console.log("[Inspector] Clicking Beli Tiket");

            const ticketPage = await this.openTicketSelection(
                context,
                page,
                buyButton,
            );

            console.log("\n========== TICKET SELECTION ==========");

            console.log(`[Inspector] URL: ${ticketPage.url()}`);
            console.log(`[Inspector] Title: ${await ticketPage.title()}`);

            await this.waitForTicketPageReady(ticketPage);

            await this.inspectTicketPage(ticketPage);

            await this.navigateToCheckout(ticketPage);

            console.log("\n[Inspector] Inspection completed");
        } finally {
            console.log("\n[Inspector] Press Enter to close browser");

            await this.waitForEnter();

            await context.close();

            console.log("[Inspector] Browser closed");
        }
    }

    private async waitForCookieConsent(page: Page): Promise<void> {
        console.log("\n[Inspector] Checking cookie consent");

        const consentText = page.getByText(
            /Kami menghargai privasi Anda/i,
        );

        try {
            await consentText.first().waitFor({
                state: "visible",
                timeout: 3_000,
            });

            console.log("[Inspector] Cookie consent detected");
            console.log(
                "[Inspector] Please choose your cookie preference manually",
            );

            await consentText.first().waitFor({
                state: "hidden",
                timeout: 120_000,
            });

            console.log("[Inspector] Cookie consent dismissed");
        } catch {
            console.log(
                "[Inspector] Cookie consent not detected or not dismissed",
            );
        }
    }

    private async findBuyTicketButton(
        page: Page,
    ): Promise<Locator | null> {
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
            console.log("[Inspector] Beli Tiket button not found");

            return null;
        }

        const count = await buttons.count();

        console.log(
            `[Inspector] Found ${count} Beli Tiket buttons`,
        );

        for (let index = 0; index < count; index++) {
            const button = buttons.nth(index);

            const visible = await button.isVisible();
            const enabled = await button.isEnabled();

            console.log(
                `[Inspector] Button ${index}: visible=${visible}, enabled=${enabled}`,
            );

            if (visible && enabled) {
                console.log(
                    `[Inspector] Selected button ${index}`,
                );

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

        console.log(
            "[Inspector] Waiting for ticket selection page",
        );

        try {
            await page.waitForURL(
                (url) => url.toString() !== EVENT_URL,
                {
                    timeout: NAVIGATION_TIMEOUT_MS,
                },
            );

            console.log(
                "[Inspector] Navigation detected in current tab",
            );

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

                console.log(
                    "[Inspector] Ticket selection opened in new tab",
                );

                return newPage;
            }

            console.log(
                "[Inspector] No URL change detected, checking current page",
            );

            return page;
        }
    }

    private async inspectTicketPage(page: Page): Promise<void> {
        await this.inspectHeadings(page);
        await this.inspectButtons(page);
        await this.inspectQuantitySelectors(page);
        await this.inspectTicketText(page);
        await this.inspectTicketControls(page);
        await this.inspectTicketCards(page);
        await this.inspectQuantityDropdown(page);
        await this.inspectOrderButton(page);
    }

    private async inspectHeadings(page: Page): Promise<void> {
        console.log("\n========== HEADINGS ==========");

        const headings = await page
            .getByRole("heading")
            .allTextContents();

        if (headings.length === 0) {
            console.log("[Inspector] No headings found");

            return;
        }

        for (const heading of headings) {
            const text = heading.trim();

            if (text) {
                console.log(`- ${text}`);
            }
        }
    }

    private async inspectButtons(page: Page): Promise<void> {
        console.log("\n========== BUTTONS ==========");

        const buttons = page.getByRole("button");

        const count = await buttons.count();

        console.log(`[Inspector] Found ${count} buttons`);

        for (let index = 0; index < count; index++) {
            const button = buttons.nth(index);

            if (!(await button.isVisible())) {
                continue;
            }

            const text = (await button.innerText()).trim();

            const enabled = await button.isEnabled();

            console.log(
                `- ${text || "(no text)"} | enabled=${enabled}`,
            );
        }
    }

    private async inspectQuantitySelectors(
        page: Page,
    ): Promise<void> {
        console.log("\n========== QUANTITY SELECTORS ==========");

        const selectors = page.locator("select");

        const count = await selectors.count();

        console.log(
            `[Inspector] Found ${count} native select elements`,
        );

        for (let index = 0; index < count; index++) {
            const selector = selectors.nth(index);

            const options = await selector
                .locator("option")
                .allTextContents();

            console.log(
                `[Inspector] Select ${index}: ${options.join(", ")}`,
            );
        }

        const comboboxes = page.getByRole("combobox");

        const comboboxCount = await comboboxes.count();

        console.log(
            `[Inspector] Found ${comboboxCount} combobox elements`,
        );
    }

    private async inspectTicketText(page: Page): Promise<void> {
        console.log("\n========== TICKET TEXT ==========");

        const bodyText = await page.locator("body").innerText();

        const lines = bodyText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);

        const ticketLines = lines.filter((line) =>
            /tiket|ticket|festival|presale|pilih|pesan|order|tersedia|habis/i.test(
                line,
            ),
        );

        if (ticketLines.length === 0) {
            console.log("[Inspector] No matching ticket text found");

            return;
        }

        for (const line of ticketLines.slice(0, 50)) {
            console.log(`- ${line}`);
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