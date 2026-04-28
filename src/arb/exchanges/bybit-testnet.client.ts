import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TopOfBook } from '../types';

interface BybitTickersResponse {
  retCode: number;
  retMsg: string;
  result: {
    category: string;
    list: Array<{
      symbol: string;
      bid1Price: string;
      ask1Price: string;
    }>;
  };
}

@Injectable()
export class BybitTestnetClient {
  private readonly logger = new Logger(BybitTestnetClient.name);
  private readonly baseUrl =
    process.env.BYBIT_TESTNET_BASE_URL ?? 'https://api-testnet.bybit.com';

  constructor(private readonly http: HttpService) {}

  async getTopOfBook(symbol: string): Promise<TopOfBook> {
    const url = `${this.baseUrl}/v5/market/tickers`;
    const { data } = await firstValueFrom(
      this.http.get<BybitTickersResponse>(url, {
        params: {
          category: 'spot',
          symbol,
        },
      }),
    );

    if (data.retCode !== 0 || !data.result?.list?.length) {
      this.logger.error(`Bybit error for ${symbol}: ${data.retMsg}`);
      throw new Error('Invalid Bybit quote');
    }

    const ticker = data.result.list[0];
    const bid = Number(ticker.bid1Price);
    const ask = Number(ticker.ask1Price);
    if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0) {
      this.logger.error(`Invalid Bybit quote received for ${symbol}`);
      throw new Error('Invalid Bybit quote');
    }

    return {
      venue: 'BYBIT_TESTNET',
      symbol: ticker.symbol,
      bid,
      ask,
      ts: Date.now(),
    };
  }
}
