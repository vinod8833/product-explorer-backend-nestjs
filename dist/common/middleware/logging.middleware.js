"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoggingMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingMiddleware = void 0;
const common_1 = require("@nestjs/common");
let LoggingMiddleware = LoggingMiddleware_1 = class LoggingMiddleware {
    constructor() {
        this.logger = new common_1.Logger(LoggingMiddleware_1.name);
    }
    use(req, res, next) {
        const startTime = Date.now();
        const { method, originalUrl, ip } = req;
        const userAgent = req.get('User-Agent') || '';
        this.logger.log(`${method} ${originalUrl} - ${ip} - ${userAgent}`);
        const originalEnd = res.end.bind(res);
        res.end = (chunk, encoding, cb) => {
            const duration = Date.now() - startTime;
            const { statusCode } = res;
            const contentLength = res.get('Content-Length') || 0;
            const logLevel = statusCode >= 400 ? 'warn' : 'log';
            const logger = new common_1.Logger(LoggingMiddleware_1.name);
            logger[logLevel](`${method} ${originalUrl} ${statusCode} ${contentLength} - ${duration}ms - ${ip}`);
            if (typeof encoding === 'function') {
                return originalEnd(chunk, encoding);
            }
            else {
                return originalEnd(chunk, encoding, cb);
            }
        };
        next();
    }
};
exports.LoggingMiddleware = LoggingMiddleware;
exports.LoggingMiddleware = LoggingMiddleware = LoggingMiddleware_1 = __decorate([
    (0, common_1.Injectable)()
], LoggingMiddleware);
//# sourceMappingURL=logging.middleware.js.map