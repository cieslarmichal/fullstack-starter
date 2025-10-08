import type { User } from '../types/user.ts';

export interface CreateUserData {
  readonly email: string;
  readonly password: string;
}

export interface UserRepository {
  create(userData: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  delete(id: string): Promise<void>;
}
