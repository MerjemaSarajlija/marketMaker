import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TopOfBook } from '../types';

interface BinanceBookTicker {
  symbol: string;
  bidPrice: string;
  askPrice: string;
}

@Injectable()
export class BinanceDemoClient {
  private readonly logger = new Logger(BinanceDemoClient.name);
  private readonly baseUrl =
    process.env.BINANCE_DEMO_BASE_URL ?? 'https://testnet.binance.vision';

  constructor(private readonly http: HttpService) {}

  async getTopOfBook(symbol: string): Promise<TopOfBook> {
    const url = `${this.baseUrl}/api/v3/ticker/bookTicker`;
    const { data } = await firstValueFrom(
      this.http.get<BinanceBookTicker>(url, { params: { symbol } }),
    );

    const bid = Number(data.bidPrice);
    const ask = Number(data.askPrice);
    if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0) {
      this.logger.error(`Invalid Binance quote received for ${symbol}`);
      throw new Error('Invalid Binance quote');
    }

    return {
      venue: 'BINANCE_DEMO',
      symbol: data.symbol,
      bid,
      ask,
      ts: Date.now(),
    };
  }
}
