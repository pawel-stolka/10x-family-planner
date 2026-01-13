import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global Exception Filter
 *
 * Catches all exceptions across the application and formats them consistently.
 * Provides:
 * - Structured error responses
 * - Detailed server-side logging
 * - Safe client-facing messages (no internal details leaked)
 * - Request context tracking
 *
 * Response format:
 * {
 *   status: number,
 *   error: string,
 *   message: string | string[],
 *   timestamp: ISO 8601 string,
 *   path: string
 * }
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getStatus(exception);
    const message = this.getSafeMessage(exception);

    const errorResponse = {
      status,
      error: this.getErrorName(status),
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Structured logging with context
    this.logger.error({
      ...errorResponse,
      userId: (request as any).user?.userId,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      method: request.method,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // Alert DevOps on 5xx errors
    if (status >= 500) {
      this.logger.error(
        `🚨 Server Error (${status}): ${message} at ${request.url}`,
        exception instanceof Error ? exception.stack : undefined
      );
      // TODO: Send to monitoring service (CloudWatch, Sentry, etc.)
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Extract HTTP status code from exception
   */
  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Get safe message for client (don't expose internal details)
   */
  private getSafeMessage(exception: unknown): string | string[] {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return response;
      }

      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const message = (response as any).message;
        return Array.isArray(message) ? message : String(message);
      }
    }

    // Don't expose internal error details to client
    return 'An unexpected error occurred';
  }

  /**
   * Map status code to human-readable error name
   */
  private getErrorName(status: number): string {
    const names: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };
    return names[status] || 'Error';
  }
}
