import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ProfilesService } from './profiles.service';
import { RolesGuard } from './roles.guard';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [ProfilesService, SupabaseAuthGuard, RolesGuard],
  exports: [ProfilesService, SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}
