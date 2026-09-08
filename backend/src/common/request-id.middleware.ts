import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { SystemMetricsService } from './system-metrics.service';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  constructor(private readonly metrics: SystemMetricsService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = request.header('x-request-id') ?? randomUUID();
    const startedAt = Date.now();
    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);
    const shouldMeasure = !request.originalUrl.startsWith(
      '/api/v1/admin/system',
    );
    if (shouldMeasure) this.metrics.requestStarted();
    let completed = false;
    const finish = (statusCode: number) => {
      if (completed) return;
      completed = true;
      const durationMs = Date.now() - startedAt;
      if (shouldMeasure) this.metrics.requestFinished(durationMs, statusCode);
      this.logger.log(
        JSON.stringify({
          event: 'request.completed',
          requestId,
          method: request.method,
          path: request.originalUrl,
          statusCode,
          durationMs,
        }),
      );
    };
    response.on('finish', () => finish(response.statusCode));
    response.on('close', () =>
      finish(response.writableEnded ? response.statusCode : 499),
    );
    next();
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}
