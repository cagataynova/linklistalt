import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload =
      exception instanceof HttpException ? exception.getResponse() : null;
    const body =
      typeof payload === 'object' && payload !== null
        ? (payload as Record<string, unknown>)
        : {};
    const rawMessage =
      body.message ??
      (exception instanceof Error
        ? exception.message
        : 'Beklenmeyen bir hata oluştu.');
    this.logger.error(
      JSON.stringify({
        event: 'request.failed',
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode: status,
        error: exception instanceof Error ? exception.name : 'UnknownError',
      }),
      status >= 500 && exception instanceof Error ? exception.stack : undefined,
    );
    response.status(status).json({
      code:
        typeof body.error === 'string'
          ? body.error.toUpperCase().replaceAll(' ', '_')
          : 'REQUEST_FAILED',
      message: Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage,
      details: body.message,
      requestId: request.requestId,
    });
  }
}
