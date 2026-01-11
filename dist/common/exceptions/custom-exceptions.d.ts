import { HttpException } from '@nestjs/common';
export declare class ScrapingException extends HttpException {
    constructor(message: string, cause?: Error);
}
export declare class DuplicateResourceException extends HttpException {
    constructor(resource: string, identifier: string);
}
export declare class ValidationException extends HttpException {
    constructor(message: string, details?: any);
}
export declare class RateLimitException extends HttpException {
    constructor(message?: string);
}
export declare class ExternalServiceException extends HttpException {
    constructor(service: string, message: string);
}
