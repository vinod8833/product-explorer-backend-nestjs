import { LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface LogContext {
    requestId?: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    method?: string;
    url?: string;
    statusCode?: number;
    responseTime?: number;
    [key: string]: any;
}
export declare class CustomLoggerService implements LoggerService {
    private configService;
    private logger;
    private context?;
    constructor(configService: ConfigService);
    setContext(context: string): void;
    private createLogger;
    log(message: string, context?: LogContext): void;
    error(message: string, trace?: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    verbose(message: string, context?: LogContext): void;
    logRequest(req: any, res: any, responseTime: number): void;
    logDatabaseQuery(query: string, parameters: any[], executionTime: number): void;
    logScrapingJob(jobId: string, status: string, details: any): void;
    logSecurityEvent(event: string, details: LogContext): void;
    logPerformanceMetric(metric: string, value: number, unit: string, context?: LogContext): void;
}
export declare function requestIdMiddleware(req: any, res: any, next: any): void;
