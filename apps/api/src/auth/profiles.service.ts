import { Injectable, Logger } from '@nestjs/common';
import { UserRole, type UserProfile } from '@alexion/shared';
import { SupabaseService } from '../supabase/supabase.service';

interface ProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
}

function toProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.CUSTOMER,
    createdAt: row.created_at,
  };
}

/** Reads and lazily provisions platform profiles backing Supabase auth users. */
@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async findById(id: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase.db
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle<ProfileRow>();

    if (error) {
      this.logger.error(`Failed to load profile ${id}: ${error.message}`);
      throw new Error(error.message);
    }
    return data ? toProfile(data) : null;
  }

  /**
   * Returns the profile for an authenticated user, creating a default
   * customer profile on first sight (so signup needs no extra wiring).
   */
  async ensureProfile(id: string, email: string): Promise<UserProfile> {
    const existing = await this.findById(id);
    if (existing) {
      return existing;
    }

    const { data, error } = await this.supabase.db
      .from('profiles')
      .upsert(
        { id, email, role: UserRole.CUSTOMER },
        { onConflict: 'id', ignoreDuplicates: false },
      )
      .select('*')
      .single<ProfileRow>();

    if (error || !data) {
      this.logger.error(`Failed to create profile ${id}: ${error?.message}`);
      throw new Error(error?.message ?? 'Could not create profile');
    }
    return toProfile(data);
  }
}
