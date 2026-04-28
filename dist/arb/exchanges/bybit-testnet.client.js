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
var BybitTestnetClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BybitTestnetClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let BybitTestnetClient = BybitTestnetClient_1 = class BybitTestnetClient {
    http;
    logger = new common_1.Logger(BybitTestnetClient_1.name);
    baseUrl = process.env.BYBIT_TESTNET_BASE_URL ?? 'https://api-testnet.bybit.com';
    constructor(http) {
        this.http = http;
    }
    async getTopOfBook(symbol) {
        const url = `${this.baseUrl}/v5/market/tickers`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.http.get(url, {
            params: {
                category: 'spot',
                symbol,
            },
        }));
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
};
exports.BybitTestnetClient = BybitTestnetClient;
exports.BybitTestnetClient = BybitTestnetClient = BybitTestnetClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], BybitTestnetClient);
//# sourceMappingURL=bybit-testnet.client.js.map