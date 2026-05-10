import type { UserRole } from '../../../../common/types/userRole.ts';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;
  readonly isEmailVerified: boolean;
  readonly isDeleted: boolean;
  readonly createdAt: Date;
}
