import { eq, lt } from 'drizzle-orm';

import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { Database } from '../../../../infrastructure/database/database.ts';
import { blacklistedTokens } from '../../../../infrastructure/database/schema.ts';
import type {
  CreateBlacklistedTokenData,
  BlacklistTokenRepository,
} from '../../domain/repositories/blacklistTokenRepository.ts';

export class BlacklistTokenRepositoryImpl implements BlacklistTokenRepository {
  private readonly database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async createBlacklistToken(tokenData: CreateBlacklistedTokenData): Promise<void> {
    const exists = await this.isTokenBlacklisted(tokenData.tokenHash);
    if (!exists) {
      await this.database.db.insert(blacklistedTokens).values({
        id: UuidService.generateUuid(),
        userId: tokenData.userId,
        tokenHash: tokenData.tokenHash,
        expiresAt: tokenData.expiresAt,
      });
    }
  }

  public async isTokenBlacklisted(tokenHash: string): Promise<boolean> {
    const [token] = await this.database.db
      .select()
      .from(blacklistedTokens)
      .where(eq(blacklistedTokens.tokenHash, tokenHash))
      .limit(1);

    return !!token;
  }

  public async deleteExpiredBlacklistedTokens(): Promise<void> {
    await this.database.db.delete(blacklistedTokens).where(lt(blacklistedTokens.expiresAt, new Date()));
  }
}
