import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { AuthUser } from '@alexion/shared';
import type { Request } from 'express';
import type { AppConfiguration } from '../config/configuration';
import { ProfilesService } from './profiles.service';

/** Express request augmented with the authenticated principal. */
export interface AuthedRequest extends Request {
  user?: AuthUser;
}

/**
 * Validates the Supabase-issued access token (HS256, signed with the project
 * JWT secret) on the Authorization header and attaches the resolved AuthUser.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(
    private readonly config: ConfigService<AppConfiguration, true>,
    private readonly profiles: ProfilesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const secret = this.config.get('supabase.jwtSecret', { infer: true });
    if (!secret) {
      this.logger.error('SUPABASE_JWT_SECRET is not configured.');
      throw new UnauthorizedException('Auth is not configured');
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userId = typeof payload.sub === 'string' ? payload.sub : null;
    const email = typeof payload.email === 'string' ? payload.email : '';
    if (!userId) {
      throw new UnauthorizedException('Token has no subject');
    }

    const profile = await this.profiles.ensureProfile(userId, email);
    request.user = { id: profile.id, email: profile.email, role: profile.role };
    return true;
  }

  private extractToken(request: AuthedRequest): string | null {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return null;
    }
    return header.slice('Bearer '.length).trim() || null;
  }
}
