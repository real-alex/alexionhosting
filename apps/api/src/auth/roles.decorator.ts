import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@alexion/shared';

export const ROLES_KEY = 'roles';

/** Restricts a route to the given platform roles (used with RolesGuard). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
