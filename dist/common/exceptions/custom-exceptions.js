"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalServiceException = exports.RateLimitException = exports.ValidationException = exports.DuplicateResourceException = exports.ScrapingException = void 0;
const common_1 = require("@nestjs/common");
class ScrapingException extends common_1.HttpException {
    constructor(message, cause) {
        super({
            message,
            error: 'Scraping Error',
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            cause: cause?.message,
        }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
exports.ScrapingException = ScrapingException;
class DuplicateResourceException extends common_1.HttpException {
    constructor(resource, identifier) {
        super({
            message: `${resource} with identifier '${identifier}' already exists`,
            error: 'Duplicate Resource',
            statusCode: common_1.HttpStatus.CONFLICT,
        }, common_1.HttpStatus.CONFLICT);
    }
}
exports.DuplicateResourceException = DuplicateResourceException;
class ValidationException extends common_1.HttpException {
    constructor(message, details) {
        super({
            message,
            error: 'Validation Error',
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            details,
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.ValidationException = ValidationException;
class RateLimitException extends common_1.HttpException {
    constructor(message = 'Rate limit exceeded') {
        super({
            message,
            error: 'Rate Limit Exceeded',
            statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
        }, common_1.HttpStatus.TOO_MANY_REQUESTS);
    }
}
exports.RateLimitException = RateLimitException;
class ExternalServiceException extends common_1.HttpException {
    constructor(service, message) {
        super({
            message: `External service error: ${service} - ${message}`,
            error: 'External Service Error',
            statusCode: common_1.HttpStatus.BAD_GATEWAY,
        }, common_1.HttpStatus.BAD_GATEWAY);
    }
}
exports.ExternalServiceException = ExternalServiceException;
//# sourceMappingURL=custom-exceptions.js.map