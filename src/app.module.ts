import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArbModule } from './arb/arb.module';

@Module({
  imports: [ArbModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
