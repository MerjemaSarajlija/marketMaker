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
var BinanceDemoClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinanceDemoClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let BinanceDemoClient = BinanceDemoClient_1 = class BinanceDemoClient {
    http;
    logger = new common_1.Logger(BinanceDemoClient_1.name);
    baseUrl = process.env.BINANCE_DEMO_BASE_URL ?? 'https://testnet.binance.vision';
    constructor(http) {
        this.http = http;
    }
    async getTopOfBook(symbol) {
        const url = `${this.baseUrl}/api/v3/ticker/bookTicker`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.http.get(url, { params: { symbol } }));
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
};
exports.BinanceDemoClient = BinanceDemoClient;
exports.BinanceDemoClient = BinanceDemoClient = BinanceDemoClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], BinanceDemoClient);
//# sourceMappingURL=binance-demo.client.js.map