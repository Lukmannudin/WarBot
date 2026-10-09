import type { Locator, Page } from "playwright";

export class TicketSelector {
  constructor(private readonly page: Page) {}

  async findTicket(
    ticketName: string,
  ): Promise<Locator> {
    console.log(
      `[TicketSelector] Looking for ticket: ${ticketName}`,
    );

    const ticketHeading = this.page.getByRole("heading", {
      name: ticketName,
      exact: true,
    });

    await ticketHeading.waitFor({
      state: "visible",
      timeout: 10_000,
    });

    const ticketCard = this.page.locator(
      "#ticket-section",
    );

    if (!(await ticketCard.isVisible())) {
      throw new Error(
        `Ticket card not visible: ${ticketName}`,
      );
    }

    console.log(
      `[TicketSelector] Found ticket: ${ticketName}`,
    );

    return ticketCard;
  }
}