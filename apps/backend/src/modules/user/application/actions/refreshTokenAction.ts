import type { TokenService } from '../../../../common/auth/tokenService.ts';
import { CryptoService } from '../../../../common/crypto/cryptoService.ts';
import { UnauthorizedAccessError } from '../../../../common/errors/unathorizedAccessError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { Config } from '../../../../core/config.ts';
import type { UserRepository } from '../../domain/repositories/userRepository.ts';
import type { UserSessionRepository } from '../../domain/repositories/userSessionRepository.ts';

interface RefreshTokenData {
  readonly refreshToken: string;
}

interface RefreshTokenResult {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export class RefreshTokenAction {
  private readonly userRepository: UserRepository;
  private readonly userSessionRepository: UserSessionRepository;
  private readonly loggerService: LoggerService;
  private readonly tokenService: TokenService;
  private readonly config: Config;

  public constructor(
    userRepository: UserRepository,
    userSessionRepository: UserSessionRepository,
    loggerService: LoggerService,
    tokenService: TokenService,
    config: Config,
  ) {
    this.userRepository = userRepository;
    this.userSessionRepository = userSessionRepository;
    this.loggerService = loggerService;
    this.tokenService = tokenService;
    this.config = config;
  }

  public async execute(data: RefreshTokenData): Promise<RefreshTokenResult> {
    const { refreshToken } = data;

    const tokenPayload = this.tokenService.verifyRefreshToken(refreshToken);

    const tokenHash = CryptoService.hashData(refreshToken);

    const user = await this.userRepository.findById(tokenPayload.userId);

    if (!user) {
      throw new UnauthorizedAccessError({
        reason: 'User not found',
        userId: tokenPayload.userId,
      });
    }

    const { sessionId } = tokenPayload;

    // Try rotate if presented hash equals current
    const newPayload = { userId: user.id, email: user.email };
    const newAccessToken = this.tokenService.generateAccessToken(newPayload);

    const newRefreshPayload = { ...newPayload, sessionId };
    const newRefreshToken = this.tokenService.generateRefreshToken(newRefreshPayload);
    const newHash = CryptoService.hashData(newRefreshToken);

    const GRACE_MS = this.config.token.refresh.graceMs;

    // Attempt atomic rotate; if it fails, try accept previous within grace
    const locked = await this.userSessionRepository.getByIdForUpdate(sessionId);
    if (!locked || locked.status !== 'active') {
      throw new UnauthorizedAccessError({ reason: 'Session not active' });
    }

    if (locked.currentRefreshHash === tokenHash) {
      await this.userSessionRepository.rotateWithGrace({ sessionId, newRefreshHash: newHash, graceMs: GRACE_MS });
    } else {
      const accepted = await this.userSessionRepository.acceptPreviousIfWithinGrace({
        sessionId,
        presentedHash: tokenHash,
      });
      if (!accepted) {
        await this.userSessionRepository.revoke(sessionId);
        throw new UnauthorizedAccessError({ reason: 'Refresh token reuse detected' });
      }
      // accepted: do not rotate again; return same newest tokens
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    }

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
