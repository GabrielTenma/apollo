import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SupabaseOrmService } from './typeorm.service';
import { ExampleEntity } from '../../supabase/entities/example.entity';

/**
 * Module that sets up TypeORM for Supabase's PostgreSQL database.
 * It reads the connection URL from the `DATABASE_URL` environment variable.
 * The module is deliberately kept separate from the legacy Supabase client
 * integration so that existing functionality remains untouched.
 */
@Module({
  imports: [
    // Ensure ConfigModule is available (it is global, but we import it for clarity)
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL') ?? '';
        // If a full connection URL is provided we can use it directly.
        // TypeORM will parse the URL and extract host, port, username, etc.
        return {
          type: 'postgres',
          url,
          // In production you would likely disable synchronize.
          // For the purpose of this integration example we enable it.
          synchronize: true,
          // Automatically load all entities registered via `forFeature`.
          autoLoadEntities: true,
        } as const;
      },
    }),
    // Register entities for injection via @InjectRepository.
    TypeOrmModule.forFeature([ExampleEntity]),
  ],
  // Export the DataSource so other modules can inject it if needed.
  providers: [
    {
      provide: 'DATA_SOURCE',
      useFactory: (dataSource: DataSource) => dataSource,
      inject: [DataSource],
    },
    SupabaseOrmService,
  ],
  exports: [TypeOrmModule, 'DATA_SOURCE', SupabaseOrmService],
})
export class SupabaseTypeOrmModule {}
