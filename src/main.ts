import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  Logger.log(`Apollo Watcher.`);
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
