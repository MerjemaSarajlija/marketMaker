import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ArbController } from './arb.controller';
import { ArbService } from './arb.service';
import { BinanceDemoClient } from './exchanges/binance-demo.client';
import { BybitTestnetClient } from './exchanges/bybit-testnet.client';

@Module({
  imports: [HttpModule],
  controllers: [ArbController],
  providers: [ArbService, BinanceDemoClient, BybitTestnetClient],
})
export class ArbModule {}
