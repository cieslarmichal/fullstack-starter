import type { TokenService } from '../../../../common/auth/tokenService.ts';
import { CryptoService } from '../../../../common/crypto/cryptoService.ts';
import { UnauthorizedAccessError } from '../../../../common/errors/unathorizedAccessError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { Config } from '../../../../core/config.ts';
import type { BlacklistTokenRepository } from '../../domain/repositories/blacklistTokenRepository.ts';
import type { UserRepository } from '../../domain/repositories/userRepository.ts';

interface RefreshTokenData {
  readonly refreshToken: string;
}

interface RefreshTokenResult {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export class RefreshTokenAction {
  private readonly userRepository: UserRepository;
  private readonly blacklistTokenRepository: BlacklistTokenRepository;
  private readonly config: Config;
  private readonly loggerService: LoggerService;
  private readonly tokenService: TokenService;

  public constructor(
    userRepository: UserRepository,
    blacklistTokenRepository: BlacklistTokenRepository,
    config: Config,
    loggerService: LoggerService,
    tokenService: TokenService,
  ) {
    this.userRepository = userRepository;
    this.blacklistTokenRepository = blacklistTokenRepository;
    this.config = config;
    this.loggerService = loggerService;
    this.tokenService = tokenService;
  }

  public async execute(data: RefreshTokenData): Promise<RefreshTokenResult> {
    const { refreshToken } = data;

    const tokenPayload = this.tokenService.verifyRefreshToken(refreshToken);

    const tokenHash = CryptoService.hashData(refreshToken);

    const isBlacklisted = await this.blacklistTokenRepository.isTokenBlacklisted(tokenHash);

    if (isBlacklisted) {
      throw new UnauthorizedAccessError({
        reason: 'Refresh token has been revoked',
      });
    }

    const user = await this.userRepository.findById(tokenPayload.userId);

    if (!user) {
      throw new UnauthorizedAccessError({
        reason: 'User not found',
        userId: tokenPayload.userId,
      });
    }

    const expiresAt = new Date(
      tokenPayload.exp ? tokenPayload.exp * 1000 : Date.now() + this.config.token.refresh.expiresIn * 1000,
    );

    await this.blacklistTokenRepository.createBlacklistToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const newPayload = { userId: user.id, email: user.email };
    const newAccessToken = this.tokenService.generateAccessToken(newPayload);
    const newRefreshToken = this.tokenService.generateRefreshToken(newPayload);

    this.loggerService.info({
      message: 'Tokens refreshed successfully.',
      userId: user.id,
      email: user.email,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
