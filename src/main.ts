import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  Logger.log(`Apollo Watcher.`);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:3000'],
  });

  // ── Serve built Vite + React frontend ──────────────────────────
  // npm run web:build outputs to dist/web/.
  // When running `node dist/main.js` → __dirname = .../dist/
  // → __dirname + '/web' = .../dist/web/ ✓
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    const webDir = join(__dirname, 'web');
    Logger.log(`Serving static web assets from: ${webDir}`);
    app.useStaticAssets(webDir, { index: 'index.html' });
  }
  // ──────────────────────────────────────────────────────────────

  await app.listen(3000, () => {
    Logger.log(`HTTP server listening on port 3000`);
  });
}
bootstrap();
