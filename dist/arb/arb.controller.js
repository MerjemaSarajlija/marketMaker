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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArbController = void 0;
const common_1 = require("@nestjs/common");
const arb_service_1 = require("./arb.service");
let ArbController = class ArbController {
    arbService;
    constructor(arbService) {
        this.arbService = arbService;
    }
    start() {
        return this.arbService.start();
    }
    stop() {
        return this.arbService.stop();
    }
    status() {
        return this.arbService.getStatus();
    }
};
exports.ArbController = ArbController;
__decorate([
    (0, common_1.Post)('start'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ArbController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('stop'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ArbController.prototype, "stop", null);
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ArbController.prototype, "status", null);
exports.ArbController = ArbController = __decorate([
    (0, common_1.Controller)('arb'),
    __metadata("design:paramtypes", [arb_service_1.ArbService])
], ArbController);
//# sourceMappingURL=arb.controller.js.map