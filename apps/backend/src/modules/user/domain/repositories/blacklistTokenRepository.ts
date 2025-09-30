export interface CreateBlacklistedTokenData {
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
}

export interface BlacklistTokenRepository {
  createBlacklistToken(tokenData: CreateBlacklistedTokenData): Promise<void>;
  isTokenBlacklisted(tokenHash: string): Promise<boolean>;
  deleteExpiredBlacklistedTokens(): Promise<void>;
}
