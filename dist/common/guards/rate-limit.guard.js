"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
let RateLimitGuard = class RateLimitGuard {
    constructor() {
        this.requests = new Map();
        this.maxRequests = 100;
        this.windowMs = 15 * 60 * 1000;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const ip = request.ip || request.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const userRequests = this.requests.get(ip);
        if (!userRequests || now > userRequests.resetTime) {
            this.requests.set(ip, {
                count: 1,
                resetTime: now + this.windowMs
            });
            return true;
        }
        if (userRequests.count >= this.maxRequests) {
            throw new common_1.HttpException({
                error: 'Too Many Requests',
                message: 'Rate limit exceeded. Please try again later.',
                retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        userRequests.count++;
        return true;
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)()
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map