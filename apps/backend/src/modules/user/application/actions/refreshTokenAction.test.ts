import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { TokenService } from '../../../../common/auth/tokenService.ts';
import { CryptoService } from '../../../../common/crypto/cryptoService.ts';
import { UnauthorizedAccessError } from '../../../../common/errors/unathorizedAccessError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig, type Config } from '../../../../core/config.ts';
import { Database } from '../../../../infrastructure/database/database.ts';
import { blacklistedTokens, users } from '../../../../infrastructure/database/schema.ts';
import { BlacklistTokenRepositoryImpl } from '../../infrastructure/repositories/blacklistTokenRepositoryImpl.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';
import { PasswordService } from '../services/passwordService.ts';

import { LoginUserAction } from './loginUserAction.ts';
import { RefreshTokenAction } from './refreshTokenAction.ts';

describe('RefreshTokenAction', () => {
  let database: Database;
  let userRepository: UserRepositoryImpl;
  let blacklistTokenRepository: BlacklistTokenRepositoryImpl;
  let loginUserAction: LoginUserAction;
  let refreshTokenAction: RefreshTokenAction;
  let loggerService: LoggerService;
  let tokenService: TokenService;
  let passwordService: PasswordService;
  let config: Config;

  beforeEach(async () => {
    config = createConfig();
    database = new Database({ url: config.database.url });
    userRepository = new UserRepositoryImpl(database);
    blacklistTokenRepository = new BlacklistTokenRepositoryImpl(database);
    tokenService = new TokenService(config);
    passwordService = new PasswordService(config);

    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    loginUserAction = new LoginUserAction(userRepository, loggerService, tokenService, passwordService);
    refreshTokenAction = new RefreshTokenAction(
      userRepository,
      blacklistTokenRepository,
      config,
      loggerService,
      tokenService,
    );

    await database.db.delete(blacklistedTokens);
    await database.db.delete(users);
  });

  afterEach(async () => {
    await database.db.delete(blacklistedTokens);
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('refreshes token successfully with valid refresh token', async () => {
      const password = Generator.password();

      const userData = Generator.userData({ password: await passwordService.hashPassword(password) });

      await userRepository.create(userData);

      const loginResult = await loginUserAction.execute({
        email: userData.email,
        password,
      });

      const oldTokenHash = CryptoService.hashData(loginResult.refreshToken);
      const wasBlacklistedBefore = await blacklistTokenRepository.isTokenBlacklisted(oldTokenHash);
      expect(wasBlacklistedBefore).toBe(false);

      // Wait 1 second to ensure different token generation time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await refreshTokenAction.execute({ refreshToken: loginResult.refreshToken });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(loginResult.refreshToken);

      const isBlacklistedAfter = await blacklistTokenRepository.isTokenBlacklisted(oldTokenHash);
      expect(isBlacklistedAfter).toBe(true);
    });

    it('throws UnauthorizedAccessError when refresh token is invalid', async () => {
      await expect(refreshTokenAction.execute({ refreshToken: 'invalid-token' })).rejects.toThrow(
        UnauthorizedAccessError,
      );
    });
  });
});
