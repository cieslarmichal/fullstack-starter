export interface User {
  readonly id: string;
  readonly email: string;
  readonly password: string;
  readonly isEmailVerified: boolean;
  readonly isDeleted: boolean;
  readonly createdAt: Date;
}
