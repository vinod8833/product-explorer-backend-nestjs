import { HttpException, HttpStatus } from '@nestjs/common';

export class ScrapingException extends HttpException {
  constructor(message: string, cause?: Error) {
    super(
      {
        message,
        error: 'Scraping Error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        cause: cause?.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class DuplicateResourceException extends HttpException {
  constructor(resource: string, identifier: string) {
    super(
      {
        message: `${resource} with identifier '${identifier}' already exists`,
        error: 'Duplicate Resource',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class ValidationException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        message,
        error: 'Validation Error',
        statusCode: HttpStatus.BAD_REQUEST,
        details,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class RateLimitException extends HttpException {
  constructor(message: string = 'Rate limit exceeded') {
    super(
      {
        message,
        error: 'Rate Limit Exceeded',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class ExternalServiceException extends HttpException {
  constructor(service: string, message: string) {
    super(
      {
        message: `External service error: ${service} - ${message}`,
        error: 'External Service Error',
        statusCode: HttpStatus.BAD_GATEWAY,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}