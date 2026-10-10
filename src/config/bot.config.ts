export interface BotConfig {
  eventUrl: string;
  ticketCategory: string;
  quantity: number;
  browserStartTime: string;
  purchaseStartTime: string;
  maxWaitForBuyButtonMs: number;
  maxWaitForTicketCategoryMs: number;
}

export const botConfig: BotConfig = {
  eventUrl:
    "https://www.loket.com/event/intimate-night-with-kahitna-w8i",

  ticketCategory: "Festival Presale 2",
  quantity: 3,

  // Open the browser two minutes before ticket sales begin.
  browserStartTime: "2026-10-10T09:58:00+07:00",

  // Start purchasing when ticket sales begin.
  purchaseStartTime: "2026-10-10T10:00:00+07:00",

  maxWaitForBuyButtonMs: 300_000,
  maxWaitForTicketCategoryMs: 300_000,
};