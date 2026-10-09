export interface BotConfig {
  eventUrl: string;
  ticketCategory: string;
  quantity: number;
  startTime: string;
}

export const botConfig: BotConfig = {
  eventUrl:
    "https://www.loket.com/event/good-day-schoolicious-harmony-in-collaboration-vol-4-wlq",

  ticketCategory: "REGULER",
  quantity: 3,

  startTime: "2026-10-10T00:04:00+07:00",
};