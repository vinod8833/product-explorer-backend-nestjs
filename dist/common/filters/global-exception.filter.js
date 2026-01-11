"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = 'Internal Server Error';
        let details = null;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object') {
                message = exceptionResponse.message || exception.message;
                error = exceptionResponse.error || 'Http Exception';
                details = exceptionResponse.details;
            }
            else {
                message = exceptionResponse;
            }
        }
        else if (exception instanceof typeorm_1.QueryFailedError) {
            status = common_1.HttpStatus.BAD_REQUEST;
            message = 'Database query failed';
            error = 'Database Error';
            if (exception.message.includes('duplicate key')) {
                message = 'Resource already exists';
                status = common_1.HttpStatus.CONFLICT;
            }
            else if (exception.message.includes('foreign key')) {
                message = 'Referenced resource not found';
                status = common_1.HttpStatus.BAD_REQUEST;
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
            error = exception.name;
        }
        const errorLog = {
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            statusCode: status,
            message,
            error,
            details,
            stack: exception instanceof Error ? exception.stack : null,
            userAgent: request.get('User-Agent'),
            ip: request.ip,
        };
        if (status >= 500) {
            this.logger.error('Internal server error', errorLog);
        }
        else {
            this.logger.warn('Client error', errorLog);
        }
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message,
            error,
            ...(details && { details }),
        });
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map