export interface User {
  readonly id: string;
  readonly email: string;
  readonly password: string;
  readonly isDeleted: boolean;
  readonly createdAt: Date;
}
