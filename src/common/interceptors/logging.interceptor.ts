import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { useLogger } from 'evlog/nestjs';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor that logs incoming HTTP requests and their responses.
 * Uses evlog for structured logging with wide events.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url } = request;
    const startTime = Date.now();

    const log = useLogger();
    log.set({ request: { method, url, startTime } });

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;
        log.set({ response: { status: statusCode, duration } });
      }),
    );
  }
}
