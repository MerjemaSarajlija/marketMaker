import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { BinanceDemoClient } from './exchanges/binance-demo.client';
import { BybitTestnetClient } from './exchanges/bybit-testnet.client';
import { ArbOpportunity, SimulatedTrade, TopOfBook, Venue } from './types';

@Injectable()
export class ArbService implements OnModuleDestroy {
  private readonly logger = new Logger(ArbService.name);

  private readonly symbol = process.env.ARB_SYMBOL ?? 'BTCUSDT';
  private readonly spreadThresholdBps = Number(process.env.ARB_SPREAD_BPS ?? 12);
  private readonly notionalUsdt = Number(process.env.ARB_NOTIONAL_USDT ?? 100);
  private readonly maxVenuePositionUsdt = Number(
    process.env.ARB_MAX_POSITION_USDT ?? 1000,
  );
  private readonly pollMs = Number(process.env.ARB_POLL_MS ?? 2000);

  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private lastError: string | null = null;

  private lastBinanceQuote: TopOfBook | null = null;
  private lastBybitQuote: TopOfBook | null = null;
  private lastOpportunity: ArbOpportunity | null = null;

  private readonly trades: SimulatedTrade[] = [];
  private readonly venuePositionUsdt: Record<Venue, number> = {
    BINANCE_DEMO: 0,
    BYBIT_TESTNET: 0,
  };

  constructor(
    private readonly binanceClient: BinanceDemoClient,
    private readonly bybitClient: BybitTestnetClient,
  ) {}

  start(): { running: boolean; message: string } {
    if (this.running) {
      return { running: true, message: 'Arbitrage loop is already running' };
    }

    this.running = true;
    this.timer = setInterval(() => {
      void this.tick();
    }, this.pollMs);
    void this.tick();

    this.logger.log(
      `Arbitrage loop started for ${this.symbol} (threshold=${this.spreadThresholdBps} bps)`,
    );
    return { running: true, message: 'Arbitrage loop started' };
  }

  stop(): { running: boolean; message: string } {
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

  private async tick(): Promise<void> {
    try {
      const [binance, bybit] = await Promise.all([
        this.binanceClient.getTopOfBook(this.symbol),
        this.bybitClient.getTopOfBook(this.symbol),
      ]);
      this.lastBinanceQuote = binance;
      this.lastBybitQuote = bybit;

      const opp1 = this.buildOpportunity(
        'BYBIT_TESTNET',
        bybit.ask,
        'BINANCE_DEMO',
        binance.bid,
      );
      const opp2 = this.buildOpportunity(
        'BINANCE_DEMO',
        binance.ask,
        'BYBIT_TESTNET',
        bybit.bid,
      );

      const best =
        !opp1 && !opp2
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.lastError = message;
      this.logger.warn(`Tick failed: ${message}`);
    }
  }

  private buildOpportunity(
    buyVenue: Venue,
    buyPrice: number,
    sellVenue: Venue,
    sellPrice: number,
  ): ArbOpportunity | null {
    const spread = sellPrice - buyPrice;
    if (spread <= 0) return null;
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

  private executeSimulatedTrade(opportunity: ArbOpportunity): void {
    const mid = (opportunity.buyPrice + opportunity.sellPrice) / 2;
    const qty = this.notionalUsdt / mid;
    const buyDeltaUsdt = qty * opportunity.buyPrice;
    const sellDeltaUsdt = qty * opportunity.sellPrice;

    const projectedBuyPosition =
      this.venuePositionUsdt[opportunity.buyVenue] + buyDeltaUsdt;
    const projectedSellPosition =
      this.venuePositionUsdt[opportunity.sellVenue] - sellDeltaUsdt;

    if (
      Math.abs(projectedBuyPosition) > this.maxVenuePositionUsdt ||
      Math.abs(projectedSellPosition) > this.maxVenuePositionUsdt
    ) {
      this.logger.warn(
        `Risk guard blocked trade, projected positions: ${opportunity.buyVenue}=${projectedBuyPosition.toFixed(2)} ${opportunity.sellVenue}=${projectedSellPosition.toFixed(2)}`,
      );
      return;
    }

    this.venuePositionUsdt[opportunity.buyVenue] = projectedBuyPosition;
    this.venuePositionUsdt[opportunity.sellVenue] = projectedSellPosition;

    const trade: SimulatedTrade = {
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

    this.logger.log(
      `SIM TRADE ${trade.symbol}: BUY ${trade.buyVenue} @ ${trade.buyPrice}, SELL ${trade.sellVenue} @ ${trade.sellPrice}, qty=${trade.qty.toFixed(6)}, pnl=${trade.grossPnlUsdt.toFixed(4)} USDT`,
    );
  }
}
