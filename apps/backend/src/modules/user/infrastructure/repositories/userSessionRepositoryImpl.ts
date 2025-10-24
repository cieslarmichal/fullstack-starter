import { and, eq, sql } from 'drizzle-orm';

import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { Database } from '../../../../infrastructure/database/database.ts';
import { userSessions } from '../../../../infrastructure/database/schema.ts';
import type {
  AcceptPreviousData,
  CreateUserSessionData,
  RotateWithGraceData,
  UserSessionRepository,
} from '../../domain/repositories/userSessionRepository.ts';
import type { UserSession } from '../../domain/types/userSession.ts';

export class UserSessionRepositoryImpl implements UserSessionRepository {
  private readonly database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async create(data: CreateUserSessionData): Promise<UserSession> {
    const id = data.id ?? UuidService.generateUuid();
    const now = new Date();

    await this.database.db.insert(userSessions).values({
      id,
      userId: data.userId,
      currentRefreshHash: data.currentRefreshHash,
      prevRefreshHash: null,
      prevUsableUntil: null,
      lastRotatedAt: now,
      status: 'active',
    });

    const row = await this.findById(id);
    if (!row) {
      throw new Error('Failed to create user session');
    }
    return row;
  }

  public async findById(sessionId: string): Promise<UserSession | null> {
    const [row] = await this.database.db.select().from(userSessions).where(eq(userSessions.id, sessionId)).limit(1);
    return row ? this.map(row) : null;
  }

  public async findByCurrentHash(tokenHash: string): Promise<UserSession | null> {
    const [row] = await this.database.db
      .select()
      .from(userSessions)
      .where(eq(userSessions.currentRefreshHash, tokenHash))
      .limit(1);
    return row ? this.map(row) : null;
  }

  public async getByIdForUpdate(sessionId: string): Promise<UserSession | null> {
    const query = this.database.db.select().from(userSessions).where(eq(userSessions.id, sessionId)).limit(1);

    const [row] = await query.for('update');
    return row ? this.map(row) : null;
  }

  public async rotateWithGrace(data: RotateWithGraceData): Promise<UserSession> {
    const now = data.now ?? new Date();
    const prevUsableUntil = new Date(now.getTime() + data.graceMs);

    await this.database.db
      .update(userSessions)
      .set({
        prevRefreshHash: sql`${userSessions.currentRefreshHash}` as unknown as string,
        prevUsableUntil,
        currentRefreshHash: data.newRefreshHash,
        lastRotatedAt: now,
        updatedAt: now,
      })
      .where(eq(userSessions.id, data.sessionId));

    const updated = await this.findById(data.sessionId);
    if (!updated) {
      throw new Error('Failed to rotate user session');
    }
    return updated;
  }

  public async acceptPreviousIfWithinGrace(data: AcceptPreviousData): Promise<boolean> {
    const now = data.now ?? new Date();
    const [row] = await this.database.db
      .select({ prevRefreshHash: userSessions.prevRefreshHash, prevUsableUntil: userSessions.prevUsableUntil })
      .from(userSessions)
      .where(eq(userSessions.id, data.sessionId))
      .limit(1);

    if (!row) return false;

    const withinGrace = row.prevUsableUntil ? now.getTime() <= new Date(row.prevUsableUntil).getTime() : false;
    return withinGrace && !!row.prevRefreshHash && row.prevRefreshHash === data.presentedHash;
  }

  public async revoke(sessionId: string): Promise<void> {
    const now = new Date();
    await this.database.db
      .update(userSessions)
      .set({ status: 'revoked', updatedAt: now })
      .where(and(eq(userSessions.id, sessionId), eq(userSessions.status, 'active')));
  }

  private map(row: typeof userSessions.$inferSelect): UserSession {
    return {
      id: row.id,
      userId: row.userId,
      currentRefreshHash: row.currentRefreshHash,
      prevRefreshHash: row.prevRefreshHash ?? null,
      prevUsableUntil: row.prevUsableUntil ?? null,
      lastRotatedAt: row.lastRotatedAt,
      status: row.status as UserSession['status'],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
