import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import { users } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';
import { PasswordService } from '../services/passwordService.ts';

import { CreateUserAction } from './createUserAction.ts';

describe('CreateUserAction', () => {
  let databaseClient: DatabaseClient;
  let userRepository: UserRepositoryImpl;
  let createUserAction: CreateUserAction;
  let loggerService: LoggerService;
  let passwordService: PasswordService;

  beforeEach(async () => {
    const config = createConfig();
    databaseClient = new DatabaseClient({ url: config.database.url });
    userRepository = new UserRepositoryImpl(databaseClient);
    passwordService = new PasswordService(config);

    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    createUserAction = new CreateUserAction(userRepository, loggerService, passwordService);

    await databaseClient.db.delete(users);
  });
  afterEach(async () => {
    await databaseClient.db.delete(users);
    await databaseClient.close();
  });

  describe('execute', () => {
    it('creates a new user successfully', async () => {
      const userData = Generator.userData();
      const context = Generator.executionContext();

      const result = await createUserAction.execute(userData, context);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.createdAt).toBeDefined();

      expect(result.password).not.toBe(userData.password);
      const isPasswordValid = await passwordService.comparePasswords(userData.password, result.password);
      expect(isPasswordValid).toBe(true);

      const storedUser = await userRepository.findById(result.id);
      expect(storedUser).toBeDefined();
      expect(storedUser?.email).toBe(userData.email);
    });

    it('throws ResourceAlreadyExistsError when user with email already exists', async () => {
      const userData = Generator.userData();
      const newUserData = Generator.userData({ email: userData.email });
      const context = Generator.executionContext();

      await createUserAction.execute(userData, context);

      await expect(createUserAction.execute(newUserData, context)).rejects.toThrow(ResourceAlreadyExistsError);
    });
  });
});
