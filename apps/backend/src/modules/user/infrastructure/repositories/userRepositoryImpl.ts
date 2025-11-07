import { eq } from 'drizzle-orm';

import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import { users } from '../../../../infrastructure/database/schema.ts';
import type { CreateUserData, UserRepository } from '../../domain/repositories/userRepository.ts';
import type { User } from '../../domain/types/user.ts';

export class UserRepositoryImpl implements UserRepository {
  private readonly databaseClient: DatabaseClient;

  public constructor(databaseClient: DatabaseClient) {
    this.databaseClient = databaseClient;
  }

  public async create(userData: CreateUserData): Promise<User> {
    const [newUser] = await this.databaseClient.db
      .insert(users)
      .values({
        id: UuidService.generateUuid(),
        email: userData.email,
        password: userData.password,
      })
      .returning();

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    return this.mapToUser(newUser);
  }

  public async findById(id: string): Promise<User | null> {
    const [user] = await this.databaseClient.db.select().from(users).where(eq(users.id, id)).limit(1);

    return user ? this.mapToUser(user) : null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.databaseClient.db.select().from(users).where(eq(users.email, email)).limit(1);

    return user ? this.mapToUser(user) : null;
  }

  public async delete(id: string): Promise<void> {
    await this.databaseClient.db.delete(users).where(eq(users.id, id));
  }

  private mapToUser(dbUser: typeof users.$inferSelect): User {
    const user: User = {
      id: dbUser.id,
      email: dbUser.email,
      password: dbUser.password,
      createdAt: dbUser.createdAt,
    };

    return user;
  }
}
