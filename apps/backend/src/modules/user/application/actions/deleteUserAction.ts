import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { UserRepository } from '../../domain/repositories/userRepository.ts';

export class DeleteUserAction {
  private readonly userRepository: UserRepository;
  private readonly loggerService: LoggerService;

  public constructor(userRepository: UserRepository, loggerService: LoggerService) {
    this.userRepository = userRepository;
    this.loggerService = loggerService;
  }

  public async execute(id: string): Promise<void> {
    this.loggerService.debug({
      message: 'Deleting user...',
      userId: id,
    });

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new ResourceNotFoundError({
        resource: 'User',
        reason: 'User not found',
        userId: id,
      });
    }

    await this.userRepository.delete(id);

    this.loggerService.info({
      message: 'User deleted successfully.',
      userId: id,
      email: user.email,
    });
  }
}
