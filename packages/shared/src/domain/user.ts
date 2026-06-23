/**
 * Platform user model.
 *
 * Identity is owned by Supabase Auth; this profile augments the auth user
 * with platform-specific fields like role.
 */

export const UserRole = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface UserProfile {
  /** Matches the Supabase auth user id. */
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  createdAt: string;
}

/** The authenticated principal attached to API requests after auth. */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}
