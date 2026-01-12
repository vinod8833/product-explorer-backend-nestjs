import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

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

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(private configService: ConfigService) {
    this.createLogger();
  }

  setContext(context: string) {
    this.context = context;
  }

  private createLogger() {
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

    const transports: winston.transport[] = [];

    transports.push(
      new winston.transports.Console({
        level: logLevel,
        format: winston.format.combine(
          ...formats,
          winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            const contextStr = context ? `[${context}] ` : '';
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level}: ${contextStr}${message}${metaStr}`;
          })
        ),
      })
    );

    if (nodeEnv === 'production') {
      transports.push(
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(...formats),
        })
      );

      transports.push(
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(...formats),
        })
      );

      transports.push(
        new DailyRotateFile({
          filename: 'logs/access-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: winston.format.combine(...formats),
        })
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      transports,
      exitOnError: false,
    });
  }

  log(message: string, context?: LogContext) {
    this.logger.info(message, { context: this.context, ...context });
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.logger.error(message, { 
      context: this.context, 
      stack: trace,
      ...context 
    });
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, { context: this.context, ...context });
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, { context: this.context, ...context });
  }

  verbose(message: string, context?: LogContext) {
    this.logger.verbose(message, { context: this.context, ...context });
  }

  logRequest(req: any, res: any, responseTime: number) {
    const logData: LogContext = {
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
    } else {
      this.log(`HTTP ${res.statusCode} - ${req.method} ${req.url}`, logData);
    }
  }

  logDatabaseQuery(query: string, parameters: any[], executionTime: number) {
    this.debug('Database Query', {
      query: query.replace(/\s+/g, ' ').trim(),
      parameters,
      executionTime,
    });
  }

  logScrapingJob(jobId: string, status: string, details: any) {
    this.log(`Scraping job ${status}`, {
      jobId,
      status,
      ...details,
    });
  }

  logSecurityEvent(event: string, details: LogContext) {
    this.warn(`Security Event: ${event}`, {
      event,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  logPerformanceMetric(metric: string, value: number, unit: string, context?: LogContext) {
    this.log(`Performance Metric: ${metric}`, {
      metric,
      value,
      unit,
      ...context,
    });
  }
}

export function requestIdMiddleware(req: any, res: any, next: any) {
  req.id = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-ID', req.id);
  next();
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}