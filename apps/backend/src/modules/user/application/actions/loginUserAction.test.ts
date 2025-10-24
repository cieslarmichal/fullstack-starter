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

describe('LoginUserAction', () => {
  let database: Database;
  let userRepository: UserRepositoryImpl;
  let loginUserAction: LoginUserAction;
  let loggerService: LoggerService;
  let tokenService: TokenService;
  let passwordService: PasswordService;
  let config: Config;
  let userSessionRepository: UserSessionRepositoryImpl;

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

    await database.db.delete(userSessions);
    await database.db.delete(users);
  });
  afterEach(async () => {
    await database.db.delete(userSessions);
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('logs in user successfully with valid credentials', async () => {
      const password = Generator.password();

      const userData = Generator.userData({ password: await passwordService.hashPassword(password) });

      const user = await userRepository.create(userData);

      const result = await loginUserAction.execute({
        email: userData.email,
        password,
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      const decodedAccess = tokenService.verifyAccessToken(result.accessToken);
      expect(decodedAccess.userId).toBe(user.id);
      expect(decodedAccess.email).toBe(user.email);

      const decodedRefresh = tokenService.verifyRefreshToken(result.refreshToken);
      expect(decodedRefresh.userId).toBe(user.id);
      expect(decodedRefresh.email).toBe(user.email);
    });

    it('throws UnauthorizedAccessError when user does not exist', async () => {
      await expect(
        loginUserAction.execute({
          email: 'nonexistent@example.com',
          password: 'anypassword',
        }),
      ).rejects.toThrow(UnauthorizedAccessError);
    });

    it('throws UnauthorizedAccessError when password is incorrect', async () => {
      const userData = Generator.userData({ password: await passwordService.hashPassword(Generator.password()) });

      await userRepository.create(userData);

      await expect(
        loginUserAction.execute({
          email: userData.email,
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedAccessError);
    });
  });
});
