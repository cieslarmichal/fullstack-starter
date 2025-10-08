import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { Database } from '../../../../infrastructure/database/database.ts';
import { users } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';

import { DeleteUserAction } from './deleteUserAction.ts';

describe('DeleteUserAction', () => {
  const config = createConfig();

  let database: Database;
  let userRepository: UserRepositoryImpl;
  let deleteUserAction: DeleteUserAction;
  let loggerService: LoggerService;

  beforeEach(async () => {
    database = new Database({ url: config.database.url });
    userRepository = new UserRepositoryImpl(database);

    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    deleteUserAction = new DeleteUserAction(userRepository, loggerService);

    await database.db.delete(users);
  });
  afterEach(async () => {
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('marks user as deleted successfully', async () => {
      const userData = Generator.userData();

      const user = await userRepository.create(userData);

      await deleteUserAction.execute(user.id);

      const deletedUser = await userRepository.findById(user.id);
      expect(deletedUser).toBeNull();
    });

    it('throws ResourceNotFoundError when user does not exist', async () => {
      const nonExistentId = Generator.uuid();

      await expect(deleteUserAction.execute(nonExistentId)).rejects.toThrow(ResourceNotFoundError);
    });
  });
});
