import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { TokenService } from '../../../../common/auth/tokenService.ts';
import { CryptoService } from '../../../../common/crypto/cryptoService.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig, type Config } from '../../../../core/config.ts';
import { Database } from '../../../../infrastructure/database/database.ts';
import { blacklistedTokens, users } from '../../../../infrastructure/database/schema.ts';
import { BlacklistTokenRepositoryImpl } from '../../infrastructure/repositories/blacklistTokenRepositoryImpl.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';
import { PasswordService } from '../services/passwordService.ts';

import { LoginUserAction } from './loginUserAction.ts';
import { LogoutUserAction } from './logoutUserAction.ts';

describe('LogoutUserAction', () => {
  let database: Database;
  let userRepository: UserRepositoryImpl;
  let blacklistTokenRepository: BlacklistTokenRepositoryImpl;
  let loginUserAction: LoginUserAction;
  let logoutUserAction: LogoutUserAction;
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
    logoutUserAction = new LogoutUserAction(blacklistTokenRepository, config, tokenService);

    await database.db.delete(blacklistedTokens);
    await database.db.delete(users);
  });
  afterEach(async () => {
    await database.db.delete(blacklistedTokens);
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('blacklists refresh token successfully', async () => {
      const password = Generator.password();

      const userData = Generator.userData({
        password: await passwordService.hashPassword(password),
      });

      await userRepository.create(userData);

      const loginResult = await loginUserAction.execute({
        email: userData.email,
        password,
      });

      await logoutUserAction.execute({ refreshToken: loginResult.refreshToken });

      const tokenHash = CryptoService.hashData(loginResult.refreshToken);
      const isBlacklisted = await blacklistTokenRepository.isTokenBlacklisted(tokenHash);

      expect(isBlacklisted).toBe(true);
    });

    it('does not throw UnauthorizedAccessError when refresh token is not provided', async () => {
      try {
        await logoutUserAction.execute({ refreshToken: undefined });
      } catch (error) {
        expect.fail('Expected no error to be thrown');
      }
    });

    it('does not throw error when refresh token is invalid', async () => {
      try {
        await logoutUserAction.execute({ refreshToken: 'invalid-token' });
      } catch (error) {
        expect.fail('Expected no error to be thrown');
      }
    });
  });
});
