import { Controller, Get, Post } from '@nestjs/common';
import { ArbService } from './arb.service';

@Controller('arb')
export class ArbController {
  constructor(private readonly arbService: ArbService) {}

  @Post('start')
  start() {
    return this.arbService.start();
  }

  @Post('stop')
  stop() {
    return this.arbService.stop();
  }

  @Get('status')
  status() {
    return this.arbService.getStatus();
  }
}
