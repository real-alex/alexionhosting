import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { NodesModule } from './nodes/nodes.module';
import { ServersModule } from './servers/servers.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      // One shared .env at the repo root, with an optional per-app override.
      envFilePath: ['.env', join(process.cwd(), '..', '..', '.env')],
    }),
    SupabaseModule,
    AuthModule,
    NodesModule,
    ServersModule,
    HealthModule,
  ],
})
export class AppModule {}
