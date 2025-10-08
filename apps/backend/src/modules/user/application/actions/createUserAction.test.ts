import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { Database } from '../../../../infrastructure/database/database.ts';
import { users } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';
import { PasswordService } from '../services/passwordService.ts';

import { CreateUserAction } from './createUserAction.ts';

describe('CreateUserAction', () => {
  let database: Database;
  let userRepository: UserRepositoryImpl;
  let createUserAction: CreateUserAction;
  let loggerService: LoggerService;
  let passwordService: PasswordService;

  beforeEach(async () => {
    const config = createConfig();
    database = new Database({ url: config.database.url });
    userRepository = new UserRepositoryImpl(database);
    passwordService = new PasswordService(config);

    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    createUserAction = new CreateUserAction(userRepository, loggerService, passwordService);

    await database.db.delete(users);
  });
  afterEach(async () => {
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('creates a new user successfully', async () => {
      const userData = Generator.userData();

      const result = await createUserAction.execute(userData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.createdAt).toBeDefined();

      expect(result.password).not.toBe(userData.password);
      const isPasswordValid = await passwordService.comparePasswords(userData.password, result.password);
      expect(isPasswordValid).toBe(true);
    });

    it('throws ResourceAlreadyExistsError when user with email already exists', async () => {
      const userData = Generator.userData();
      const newUserData = Generator.userData({ email: userData.email });

      await createUserAction.execute(userData);

      await expect(createUserAction.execute(newUserData)).rejects.toThrow(ResourceAlreadyExistsError);
    });
  });
});
