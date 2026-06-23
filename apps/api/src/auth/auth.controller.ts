import { Controller, Get, UseGuards } from '@nestjs/common';
import type { AuthUser, UserProfile } from '@alexion/shared';
import { CurrentUser } from './current-user.decorator';
import { ProfilesService } from './profiles.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Controller('auth')
@UseGuards(SupabaseAuthGuard)
export class AuthController {
  constructor(private readonly profiles: ProfilesService) {}

  /** Returns the current user's profile; the web app calls this after login. */
  @Get('me')
  async me(@CurrentUser() user: AuthUser): Promise<UserProfile> {
    return this.profiles.ensureProfile(user.id, user.email);
  }
}
