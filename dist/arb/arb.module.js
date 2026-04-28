"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArbModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const arb_controller_1 = require("./arb.controller");
const arb_service_1 = require("./arb.service");
const binance_demo_client_1 = require("./exchanges/binance-demo.client");
const bybit_testnet_client_1 = require("./exchanges/bybit-testnet.client");
let ArbModule = class ArbModule {
};
exports.ArbModule = ArbModule;
exports.ArbModule = ArbModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
        controllers: [arb_controller_1.ArbController],
        providers: [arb_service_1.ArbService, binance_demo_client_1.BinanceDemoClient, bybit_testnet_client_1.BybitTestnetClient],
    })
], ArbModule);
//# sourceMappingURL=arb.module.js.map