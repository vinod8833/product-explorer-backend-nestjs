import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || 'Http Exception';
        details = (exceptionResponse as any).details;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database query failed';
      error = 'Database Error';
      
      if (exception.message.includes('duplicate key')) {
        message = 'Resource already exists';
        status = HttpStatus.CONFLICT;
      } else if (exception.message.includes('foreign key')) {
        message = 'Referenced resource not found';
        status = HttpStatus.BAD_REQUEST;
      }
    } else if (exception instanceof Error) {
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
    } else {
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
}