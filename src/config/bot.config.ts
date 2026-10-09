export interface BotConfig {
    eventUrl: string;
    ticketCategory: string;
    quantity: number;
    startTime: string;
    maxWaitForBuyButtonMs: number;
    maxWaitForTicketCategoryMs: number;
}

export const botConfig: BotConfig = {
    eventUrl:
        "https://www.loket.com/event/intimate-night-with-kahitna-w8i",

    ticketCategory: "Festival Presale 2",
    quantity: 3,

    // 10 Oktober 2026, pukul 10.00 WIB
    startTime: "2026-10-10T10:00:00+07:00",

    // Maksimal menunggu tombol Beli Tiket selama 5 menit
    maxWaitForBuyButtonMs: 300_000,

    // Maksimal menunggu kategori tiket selama 5 menit
    maxWaitForTicketCategoryMs: 300_000,
};