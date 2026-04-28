export type Venue = 'BINANCE_DEMO' | 'BYBIT_TESTNET';
export interface TopOfBook {
    venue: Venue;
    symbol: string;
    bid: number;
    ask: number;
    ts: number;
}
export interface ArbOpportunity {
    buyVenue: Venue;
    sellVenue: Venue;
    symbol: string;
    spreadBps: number;
    buyPrice: number;
    sellPrice: number;
    ts: number;
}
export interface SimulatedTrade {
    id: string;
    symbol: string;
    buyVenue: Venue;
    sellVenue: Venue;
    qty: number;
    buyPrice: number;
    sellPrice: number;
    grossPnlUsdt: number;
    ts: number;
}
