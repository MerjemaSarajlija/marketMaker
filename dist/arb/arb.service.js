"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ArbService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArbService = void 0;
const common_1 = require("@nestjs/common");
const binance_demo_client_1 = require("./exchanges/binance-demo.client");
const bybit_testnet_client_1 = require("./exchanges/bybit-testnet.client");
let ArbService = ArbService_1 = class ArbService {
    binanceClient;
    bybitClient;
    logger = new common_1.Logger(ArbService_1.name);
    symbol = process.env.ARB_SYMBOL ?? 'BTCUSDT';
    spreadThresholdBps = Number(process.env.ARB_SPREAD_BPS ?? 12);
    notionalUsdt = Number(process.env.ARB_NOTIONAL_USDT ?? 100);
    maxVenuePositionUsdt = Number(process.env.ARB_MAX_POSITION_USDT ?? 1000);
    pollMs = Number(process.env.ARB_POLL_MS ?? 2000);
    timer = null;
    running = false;
    lastError = null;
    lastBinanceQuote = null;
    lastBybitQuote = null;
    lastOpportunity = null;
    trades = [];
    venuePositionUsdt = {
        BINANCE_DEMO: 0,
        BYBIT_TESTNET: 0,
    };
    constructor(binanceClient, bybitClient) {
        this.binanceClient = binanceClient;
        this.bybitClient = bybitClient;
    }
    start() {
        if (this.running) {
            return { running: true, message: 'Arbitrage loop is already running' };
        }
        this.running = true;
        this.timer = setInterval(() => {
            void this.tick();
        }, this.pollMs);
        void this.tick();
        this.logger.log(`Arbitrage loop started for ${this.symbol} (threshold=${this.spreadThresholdBps} bps)`);
        return { running: true, message: 'Arbitrage loop started' };
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.running = false;
        this.logger.log('Arbitrage loop stopped');
        return { running: false, message: 'Arbitrage loop stopped' };
    }
    getStatus() {
        return {
            running: this.running,
            config: {
                symbol: this.symbol,
                spreadThresholdBps: this.spreadThresholdBps,
                notionalUsdt: this.notionalUsdt,
                maxVenuePositionUsdt: this.maxVenuePositionUsdt,
                pollMs: this.pollMs,
            },
            quotes: {
                binance: this.lastBinanceQuote,
                bybit: this.lastBybitQuote,
            },
            lastOpportunity: this.lastOpportunity,
            positionUsdtByVenue: this.venuePositionUsdt,
            totalGrossPnlUsdt: this.trades.reduce((acc, t) => acc + t.grossPnlUsdt, 0),
            tradesCount: this.trades.length,
            recentTrades: this.trades.slice(-20).reverse(),
            lastError: this.lastError,
        };
    }
    onModuleDestroy() {
        this.stop();
    }
    async tick() {
        try {
            const [binance, bybit] = await Promise.all([
                this.binanceClient.getTopOfBook(this.symbol),
                this.bybitClient.getTopOfBook(this.symbol),
            ]);
            this.lastBinanceQuote = binance;
            this.lastBybitQuote = bybit;
            const opp1 = this.buildOpportunity('BYBIT_TESTNET', bybit.ask, 'BINANCE_DEMO', binance.bid);
            const opp2 = this.buildOpportunity('BINANCE_DEMO', binance.ask, 'BYBIT_TESTNET', bybit.bid);
            const best = !opp1 && !opp2
                ? null
                : !opp1
                    ? opp2
                    : !opp2
                        ? opp1
                        : opp1.spreadBps >= opp2.spreadBps
                            ? opp1
                            : opp2;
            this.lastOpportunity = best;
            if (best && best.spreadBps >= this.spreadThresholdBps) {
                this.executeSimulatedTrade(best);
            }
            this.lastError = null;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.lastError = message;
            this.logger.warn(`Tick failed: ${message}`);
        }
    }
    buildOpportunity(buyVenue, buyPrice, sellVenue, sellPrice) {
        const spread = sellPrice - buyPrice;
        if (spread <= 0)
            return null;
        const spreadBps = (spread / buyPrice) * 10_000;
        return {
            buyVenue,
            sellVenue,
            symbol: this.symbol,
            spreadBps,
            buyPrice,
            sellPrice,
            ts: Date.now(),
        };
    }
    executeSimulatedTrade(opportunity) {
        const mid = (opportunity.buyPrice + opportunity.sellPrice) / 2;
        const qty = this.notionalUsdt / mid;
        const buyDeltaUsdt = qty * opportunity.buyPrice;
        const sellDeltaUsdt = qty * opportunity.sellPrice;
        const projectedBuyPosition = this.venuePositionUsdt[opportunity.buyVenue] + buyDeltaUsdt;
        const projectedSellPosition = this.venuePositionUsdt[opportunity.sellVenue] - sellDeltaUsdt;
        if (Math.abs(projectedBuyPosition) > this.maxVenuePositionUsdt ||
            Math.abs(projectedSellPosition) > this.maxVenuePositionUsdt) {
            this.logger.warn(`Risk guard blocked trade, projected positions: ${opportunity.buyVenue}=${projectedBuyPosition.toFixed(2)} ${opportunity.sellVenue}=${projectedSellPosition.toFixed(2)}`);
            return;
        }
        this.venuePositionUsdt[opportunity.buyVenue] = projectedBuyPosition;
        this.venuePositionUsdt[opportunity.sellVenue] = projectedSellPosition;
        const trade = {
            id: `${Date.now()}-${this.trades.length + 1}`,
            symbol: opportunity.symbol,
            buyVenue: opportunity.buyVenue,
            sellVenue: opportunity.sellVenue,
            qty,
            buyPrice: opportunity.buyPrice,
            sellPrice: opportunity.sellPrice,
            grossPnlUsdt: (opportunity.sellPrice - opportunity.buyPrice) * qty,
            ts: Date.now(),
        };
        this.trades.push(trade);
        if (this.trades.length > 200) {
            this.trades.splice(0, this.trades.length - 200);
        }
        this.logger.log(`SIM TRADE ${trade.symbol}: BUY ${trade.buyVenue} @ ${trade.buyPrice}, SELL ${trade.sellVenue} @ ${trade.sellPrice}, qty=${trade.qty.toFixed(6)}, pnl=${trade.grossPnlUsdt.toFixed(4)} USDT`);
    }
};
exports.ArbService = ArbService;
exports.ArbService = ArbService = ArbService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [binance_demo_client_1.BinanceDemoClient,
        bybit_testnet_client_1.BybitTestnetClient])
], ArbService);
//# sourceMappingURL=arb.service.js.map