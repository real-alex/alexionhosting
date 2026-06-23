import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '@alexion/shared';
import type { AuthedRequest } from './supabase-auth.guard';

/** Injects the authenticated AuthUser attached by SupabaseAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!request.user) {
      throw new Error('CurrentUser used on a route without SupabaseAuthGuard');
    }
    return request.user;
  },
);
