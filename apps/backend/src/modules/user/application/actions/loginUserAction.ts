import type { TokenService } from '../../../../common/auth/tokenService.ts';
import { UnauthorizedAccessError } from '../../../../common/errors/unathorizedAccessError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { UserRepository } from '../../domain/repositories/userRepository.ts';
import type { PasswordService } from '../services/passwordService.ts';

interface LoginData {
  readonly email: string;
  readonly password: string;
}

interface LoginResult {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export class LoginUserAction {
  private readonly userRepository: UserRepository;
  private readonly loggerService: LoggerService;
  private readonly tokenService: TokenService;
  private readonly passwordService: PasswordService;

  public constructor(
    userRepository: UserRepository,
    loggerService: LoggerService,
    tokenService: TokenService,
    passwordService: PasswordService,
  ) {
    this.userRepository = userRepository;
    this.loggerService = loggerService;
    this.tokenService = tokenService;
    this.passwordService = passwordService;
  }

  public async execute(loginData: LoginData): Promise<LoginResult> {
    const normalizedEmail = loginData.email.toLowerCase();

    this.loggerService.debug({
      message: 'Starting user login...',
      email: normalizedEmail,
    });

    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedAccessError({
        reason: 'Invalid credentials',
        email: normalizedEmail,
      });
    }

    const isPasswordValid = await this.passwordService.comparePasswords(loginData.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedAccessError({
        reason: 'Invalid credentials',
        email: normalizedEmail,
      });
    }

    const payload = { userId: user.id, email: user.email };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    this.loggerService.info({
      message: 'User logged in successfully',
      userId: user.id,
      email: user.email,
    });

    return { accessToken, refreshToken };
  }
}
