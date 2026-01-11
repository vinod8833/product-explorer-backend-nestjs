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
exports.CustomLoggerService = void 0;
exports.requestIdMiddleware = requestIdMiddleware;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
let CustomLoggerService = class CustomLoggerService {
    constructor(configService) {
        this.configService = configService;
        this.createLogger();
    }
    setContext(context) {
        this.context = context;
    }
    createLogger() {
        const logLevel = this.configService.get('LOG_LEVEL', 'info');
        const nodeEnv = this.configService.get('NODE_ENV', 'development');
        const formats = [
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            winston.format.errors({ stack: true }),
            winston.format.json(),
        ];
        if (nodeEnv === 'development') {
            formats.push(winston.format.colorize({ all: true }));
        }
        const transports = [];
        transports.push(new winston.transports.Console({
            level: logLevel,
            format: winston.format.combine(...formats, winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                const contextStr = context ? `[${context}] ` : '';
                const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                return `${timestamp} ${level}: ${contextStr}${message}${metaStr}`;
            })),
        }));
        if (nodeEnv === 'production') {
            transports.push(new DailyRotateFile({
                filename: 'logs/error-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                level: 'error',
                maxSize: '20m',
                maxFiles: '14d',
                format: winston.format.combine(...formats),
            }));
            transports.push(new DailyRotateFile({
                filename: 'logs/combined-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '14d',
                format: winston.format.combine(...formats),
            }));
            transports.push(new DailyRotateFile({
                filename: 'logs/access-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '30d',
                format: winston.format.combine(...formats),
            }));
        }
        this.logger = winston.createLogger({
            level: logLevel,
            transports,
            exitOnError: false,
        });
    }
    log(message, context) {
        this.logger.info(message, { context: this.context, ...context });
    }
    error(message, trace, context) {
        this.logger.error(message, {
            context: this.context,
            stack: trace,
            ...context
        });
    }
    warn(message, context) {
        this.logger.warn(message, { context: this.context, ...context });
    }
    debug(message, context) {
        this.logger.debug(message, { context: this.context, ...context });
    }
    verbose(message, context) {
        this.logger.verbose(message, { context: this.context, ...context });
    }
    logRequest(req, res, responseTime) {
        const logData = {
            requestId: req.id,
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            responseTime,
        };
        if (res.statusCode >= 400) {
            this.error(`HTTP ${res.statusCode} - ${req.method} ${req.url}`, undefined, logData);
        }
        else {
            this.log(`HTTP ${res.statusCode} - ${req.method} ${req.url}`, logData);
        }
    }
    logDatabaseQuery(query, parameters, executionTime) {
        this.debug('Database Query', {
            query: query.replace(/\s+/g, ' ').trim(),
            parameters,
            executionTime,
        });
    }
    logScrapingJob(jobId, status, details) {
        this.log(`Scraping job ${status}`, {
            jobId,
            status,
            ...details,
        });
    }
    logSecurityEvent(event, details) {
        this.warn(`Security Event: ${event}`, {
            event,
            timestamp: new Date().toISOString(),
            ...details,
        });
    }
    logPerformanceMetric(metric, value, unit, context) {
        this.log(`Performance Metric: ${metric}`, {
            metric,
            value,
            unit,
            ...context,
        });
    }
};
exports.CustomLoggerService = CustomLoggerService;
exports.CustomLoggerService = CustomLoggerService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.TRANSIENT }),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CustomLoggerService);
function requestIdMiddleware(req, res, next) {
    req.id = req.headers['x-request-id'] || generateRequestId();
    res.setHeader('X-Request-ID', req.id);
    next();
}
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
//# sourceMappingURL=logger.service.js.map