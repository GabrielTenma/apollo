import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(readonly _appService: AppService) {}

  /**
   * Simple health endpoint used by the default NestJS starter.
   * Returns a static greeting string.
   */
  @Get()
  getHello(): string {
    return 'Hello World!';
  }
}
