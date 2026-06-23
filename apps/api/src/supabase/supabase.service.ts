import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppConfiguration } from '../config/configuration';

/**
 * Thin wrapper around a service-role Supabase client. The service role bypasses
 * row-level security, so this client is only ever used server-side by the API.
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;

  constructor(private readonly config: ConfigService<AppConfiguration, true>) {}

  onModuleInit(): void {
    const url = this.config.get('supabase.url', { infer: true });
    const serviceRoleKey = this.config.get('supabase.serviceRoleKey', { infer: true });

    if (!url || !serviceRoleKey) {
      this.logger.warn(
        'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. ' +
          'Database calls will fail until you configure Supabase in .env.',
      );
      return;
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    this.logger.log('Supabase service-role client ready.');
  }

  /** Returns the configured client, throwing a clear error if env is missing. */
  get db(): SupabaseClient {
    if (!this.client) {
      throw new Error(
        'Supabase client is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.',
      );
    }
    return this.client;
  }
}
