import { ArbService } from './arb.service';
export declare class ArbController {
    private readonly arbService;
    constructor(arbService: ArbService);
    start(): {
        running: boolean;
        message: string;
    };
    stop(): {
        running: boolean;
        message: string;
    };
    status(): {
        running: boolean;
        config: {
            symbol: string;
            spreadThresholdBps: number;
            notionalUsdt: number;
            maxVenuePositionUsdt: number;
            pollMs: number;
        };
        quotes: {
            binance: import("./types").TopOfBook | null;
            bybit: import("./types").TopOfBook | null;
        };
        lastOpportunity: import("./types").ArbOpportunity | null;
        positionUsdtByVenue: Record<import("./types").Venue, number>;
        totalGrossPnlUsdt: number;
        tradesCount: number;
        recentTrades: import("./types").SimulatedTrade[];
        lastError: string | null;
    };
}
