import { OnModuleDestroy } from '@nestjs/common';
import { BinanceDemoClient } from './exchanges/binance-demo.client';
import { BybitTestnetClient } from './exchanges/bybit-testnet.client';
import { ArbOpportunity, SimulatedTrade, TopOfBook, Venue } from './types';
export declare class ArbService implements OnModuleDestroy {
    private readonly binanceClient;
    private readonly bybitClient;
    private readonly logger;
    private readonly symbol;
    private readonly spreadThresholdBps;
    private readonly notionalUsdt;
    private readonly maxVenuePositionUsdt;
    private readonly pollMs;
    private timer;
    private running;
    private lastError;
    private lastBinanceQuote;
    private lastBybitQuote;
    private lastOpportunity;
    private readonly trades;
    private readonly venuePositionUsdt;
    constructor(binanceClient: BinanceDemoClient, bybitClient: BybitTestnetClient);
    start(): {
        running: boolean;
        message: string;
    };
    stop(): {
        running: boolean;
        message: string;
    };
    getStatus(): {
        running: boolean;
        config: {
            symbol: string;
            spreadThresholdBps: number;
            notionalUsdt: number;
            maxVenuePositionUsdt: number;
            pollMs: number;
        };
        quotes: {
            binance: TopOfBook | null;
            bybit: TopOfBook | null;
        };
        lastOpportunity: ArbOpportunity | null;
        positionUsdtByVenue: Record<Venue, number>;
        totalGrossPnlUsdt: number;
        tradesCount: number;
        recentTrades: SimulatedTrade[];
        lastError: string | null;
    };
    onModuleDestroy(): void;
    private tick;
    private buildOpportunity;
    private executeSimulatedTrade;
}
