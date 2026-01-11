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
var SecurityMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSlowDown = exports.createRateLimiter = exports.SecurityMiddleware = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SecurityMiddleware = SecurityMiddleware_1 = class SecurityMiddleware {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SecurityMiddleware_1.name);
    }
    use(req, res, next) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');
        next();
    }
};
exports.SecurityMiddleware = SecurityMiddleware;
exports.SecurityMiddleware = SecurityMiddleware = SecurityMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SecurityMiddleware);
const createRateLimiter = (configService) => {
    const requests = new Map();
    const maxRequests = configService.get('RATE_LIMIT_MAX', 100);
    const windowMs = 15 * 60 * 1000;
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const userRequests = requests.get(ip);
        if (!userRequests || now > userRequests.resetTime) {
            requests.set(ip, { count: 1, resetTime: now + windowMs });
            return next();
        }
        if (userRequests.count >= maxRequests) {
            return res.status(429).json({
                error: 'Too Many Requests',
                message: 'Rate limit exceeded. Please try again later.',
            });
        }
        userRequests.count++;
        next();
    };
};
exports.createRateLimiter = createRateLimiter;
const createSlowDown = (configService) => {
    return (req, res, next) => {
        next();
    };
};
exports.createSlowDown = createSlowDown;
//# sourceMappingURL=security.middleware.js.map