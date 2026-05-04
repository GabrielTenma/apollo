import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

/**
 * Interceptor that wraps all successful HTTP responses in a standard JSON envelope.
 * This ensures consistent response formatting across the application.
 * Includes correlation_id for request tracing.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  /**
   * Intercepts the outgoing response and wraps it in a standard format.
   *
   * @param context - The execution context of the current request.
   * @param next - The call handler that passes control to the next interceptor or route handler.
   * @returns An observable that emits the wrapped response.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    
    // Get or generate correlation ID
    const correlationId = 
      (request.headers['x-correlation-id'] as string) || 
      (request.headers['x-request-id'] as string) ||
      crypto.randomUUID();
    
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        correlation_id: correlationId,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
