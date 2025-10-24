import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { TokenService } from '../../../../common/auth/tokenService.ts';
import { UnauthorizedAccessError } from '../../../../common/errors/unathorizedAccessError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig, type Config } from '../../../../core/config.ts';
import { Database } from '../../../../infrastructure/database/database.ts';
import { userSessions, users } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';
import { UserSessionRepositoryImpl } from '../../infrastructure/repositories/userSessionRepositoryImpl.ts';
import { PasswordService } from '../services/passwordService.ts';

import { LoginUserAction } from './loginUserAction.ts';
import { RefreshTokenAction } from './refreshTokenAction.ts';

describe('RefreshTokenAction', () => {
  let database: Database;
  let userRepository: UserRepositoryImpl;
  let userSessionRepository: UserSessionRepositoryImpl;
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
    userSessionRepository = new UserSessionRepositoryImpl(database);
    tokenService = new TokenService(config);
    passwordService = new PasswordService(config);

    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    loginUserAction = new LoginUserAction(
      userRepository,
      loggerService,
      tokenService,
      passwordService,
      userSessionRepository,
    );
    refreshTokenAction = new RefreshTokenAction(
      userRepository,
      userSessionRepository,
      loggerService,
      tokenService,
      config,
    );

    await database.db.delete(userSessions);
    await database.db.delete(users);
  });

  afterEach(async () => {
    await database.db.delete(userSessions);
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('refreshes token successfully with valid refresh token and rotates session hash', async () => {
      const password = Generator.password();

      const userData = Generator.userData({ password: await passwordService.hashPassword(password) });

      await userRepository.create(userData);

      const loginResult = await loginUserAction.execute({
        email: userData.email,
        password,
      });

      const { sessionId } = tokenService.verifyRefreshToken(loginResult.refreshToken);
      const sessionBefore = await userSessionRepository.findById(sessionId);
      expect(sessionBefore?.currentRefreshHash).toBeDefined();

      // Wait 1 second to ensure different token generation time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await refreshTokenAction.execute({ refreshToken: loginResult.refreshToken });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(loginResult.refreshToken);

      const sessionAfter = await userSessionRepository.findById(sessionId);
      expect(sessionAfter?.currentRefreshHash).toBeDefined();
      expect(sessionAfter?.currentRefreshHash).not.toBe(sessionBefore?.currentRefreshHash);
      expect(sessionAfter?.prevRefreshHash).toBe(sessionBefore?.currentRefreshHash ?? null);
    });

    it('throws UnauthorizedAccessError when refresh token is invalid', async () => {
      await expect(refreshTokenAction.execute({ refreshToken: 'invalid-token' })).rejects.toThrow(
        UnauthorizedAccessError,
      );
    });
  });
});
