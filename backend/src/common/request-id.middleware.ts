import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = request.header('x-request-id') ?? randomUUID();
    const startedAt = Date.now();
    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);
    response.on('finish', () => {
      this.logger.log(
        JSON.stringify({
          event: 'request.completed',
          requestId,
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        }),
      );
    });
    next();
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}
