import { Module, Global } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { RoutineService } from './routines/services/routine.service';
import { RoutineConfigModule } from './routines/config/routine.config.module';  
import { OpenrouterRoutineService } from '../openrouter/routines/openrouter-routine.service';
import { ScraperRoutineService } from '../scraper/routines/scraper-routine.service';
/**
 * Global module that aggregates and exports shared cross-cutting concerns
 * such as authentication guards, role-based authorization, response transformers,
 * logging, and exception filters.
 *
 * By marking this module as `@Global()`, it only needs to be imported once
 * (typically in the root `AppModule`) and its providers will be available
 * throughout the entire application.
 *
 * It also registers the guards, interceptors, and filters as global providers
 * using the `APP_*` tokens, ensuring they are automatically applied to all routes.
 */
@Global()
@Module({
  imports: [RoutineConfigModule],
  providers: [
    // Guards: Applied globally in order (JWT authentication first, then Roles authorization)
    JwtAuthGuard,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Interceptors: Applied globally to all routes
    TransformInterceptor,
    LoggingInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Filters: Applied globally to all routes
    HttpExceptionFilter,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Routine Service: For executing configurable routines
    RoutineService,
    ScraperRoutineService,
    OpenrouterRoutineService
  ],
  exports: [
    // Export the classes so they can be injected or used explicitly if needed
    JwtAuthGuard,
    RolesGuard,
    TransformInterceptor,
    LoggingInterceptor,
    HttpExceptionFilter,
    RoutineService,
    ScraperRoutineService,
    OpenrouterRoutineService,
  ],
})
export class CommonModule {}
