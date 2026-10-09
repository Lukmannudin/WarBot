import { BrowserManager } from "../browser/BrowserManager.js";
import {
    TicketAvailabilityChecker,
} from "../automation/TicketAvailabilityChecker.js";
import { TicketSelector } from "../automation/TicketSelector.js";
import { QuantitySelector } from "../automation/QuantitySelector.js";
import { BotState } from "./BotState.js";
import { OrderFlowHandler } from "../automation/OrderFlowHandler.js";
import { CheckoutVerifier } from "../automation/CheckoutVerifier.js";

export interface TicketBotOptions {
  simulatorUrl: string;
  ticketName: string;
  quantity: number;
  ticketPrice: number;
  maxChecks: number;
  refreshTimeoutMs: number;
}

export class TicketBot {
    private state = BotState.IDLE;

    private readonly browserManager = new BrowserManager();
    private readonly abortController = new AbortController();

    constructor(
        private readonly options: TicketBotOptions,
    ) { }

    async run(): Promise<void> {
        try {
            const page = await this.browserManager.launch();

            this.updateState(BotState.BROWSER_READY);

            await page.goto(this.options.simulatorUrl, {
                waitUntil: "domcontentloaded",
                timeout: 15_000,
            });

            this.throwIfCancelled();

            this.updateState(BotState.CHECKING_AVAILABILITY);

            const availabilityChecker =
                new TicketAvailabilityChecker(page, {
                    maxChecks: this.options.maxChecks,
                    refreshTimeoutMs:
                        this.options.refreshTimeoutMs,
                });

            const availabilityResult =
                await availabilityChecker.check(
                    this.abortController.signal,
                );

            this.throwIfCancelled();

            if (!availabilityResult.available) {
                throw new Error(
                    `Tickets unavailable after ${availabilityResult.checksPerformed} checks`,
                );
            }

            this.updateState(BotState.TICKETS_AVAILABLE);

            console.log(
                `[TicketBot] Tickets available after ${availabilityResult.checksPerformed} checks`,
            );

            this.updateState(BotState.FINDING_TICKET);

            const ticketSelector = new TicketSelector(page);

            const ticketCard = await ticketSelector.findTicket(
                this.options.ticketName,
            );

            this.throwIfCancelled();

            this.updateState(BotState.SELECTING_QUANTITY);

            const quantitySelector = new QuantitySelector();

            await quantitySelector.selectQuantity(
                ticketCard,
                this.options.quantity,
            );

            this.throwIfCancelled();

            this.updateState(BotState.QUANTITY_SELECTED);

            const orderButton = ticketCard.getByRole("button", {
                name: /^(Order Now|Pesan Sekarang)$/i,
            });

            await orderButton.waitFor({
                state: "visible",
                timeout: 10_000,
            });

            if (!(await orderButton.isEnabled())) {
                throw new Error(
                    "Order button is disabled after selecting quantity",
                );
            }

            this.updateState(BotState.ORDER_BUTTON_READY);

            console.log(
                `[TicketBot] Order button detected: ${await orderButton.textContent()}`,
            );

            this.throwIfCancelled();

            this.updateState(BotState.CLICKING_ORDER);

            const orderFlowHandler = new OrderFlowHandler(page, {
                agreementTimeoutMs: 120_000,
                checkoutTimeoutMs: 15_000,
            });

            const result = await orderFlowHandler.proceed(
                orderButton,
                this.abortController.signal,
            );

            this.throwIfCancelled();

            if (!result.checkoutReached) {
                throw new Error("Failed to reach mock checkout");
            }

            this.updateState(BotState.CHECKOUT_REACHED);

            console.log(
                `[TicketBot] Agreement shown: ${result.agreementShown}`,
            );

            this.throwIfCancelled();

            this.updateState(BotState.VERIFYING_CHECKOUT);

            const checkoutVerifier = new CheckoutVerifier(page);

            const verification = await checkoutVerifier.verify({
                ticketName: this.options.ticketName,
                quantity: this.options.quantity,
                ticketPrice: this.options.ticketPrice,
            });

            this.throwIfCancelled();

            this.updateState(BotState.CHECKOUT_VERIFIED);

            console.log(
                `[TicketBot] Verified ${verification.quantity} tickets`,
            );

            console.log(
                `[TicketBot] Verified total: Rp${verification.total.toLocaleString("id-ID")}`,
            );

            console.log(
                "[TicketBot] Successfully reached mock checkout",
            );

            this.updateState(BotState.COMPLETED);
        } catch (error: unknown) {
            if (this.abortController.signal.aborted) {
                this.updateState(BotState.CANCELLED);
                return;
            }

            this.updateState(BotState.FAILED);

            throw error;
        } finally {
            await this.browserManager.close();
        }
    }

    cancel(): void {
        if (this.abortController.signal.aborted) {
            return;
        }

        console.log("[TicketBot] Cancellation requested");

        this.abortController.abort();
    }

    private throwIfCancelled(): void {
        if (this.abortController.signal.aborted) {
            throw new Error("Operation cancelled");
        }
    }

    private updateState(state: BotState): void {
        this.state = state;

        console.log(`[TicketBot] State: ${this.state}`);
    }
}