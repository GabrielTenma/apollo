import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interceptor that wraps all successful HTTP responses in a standard JSON envelope.
 * This ensures consistent response formatting across the application.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  /**
   * Intercepts the outgoing response and wraps it in a standard format.
   *
   * @param _context - The execution context of the current request (unused here).
   * @param next - The call handler that passes control to the next interceptor or route handler.
   * @returns An observable that emits the wrapped response.
   */
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}