import type { TokenPayload } from '../../../../common/auth/token.ts';
import type { TokenService } from '../../../../common/auth/tokenService.ts';
import { CryptoService } from '../../../../common/crypto/cryptoService.ts';
import type { Config } from '../../../../core/config.ts';
import type { BlacklistTokenRepository } from '../../domain/repositories/blacklistTokenRepository.ts';

interface LogoutData {
  readonly refreshToken: string | undefined;
}

export class LogoutUserAction {
  private readonly blacklistTokenRepository: BlacklistTokenRepository;
  private readonly config: Config;
  private readonly tokenService: TokenService;

  public constructor(blacklistTokenRepository: BlacklistTokenRepository, config: Config, tokenService: TokenService) {
    this.blacklistTokenRepository = blacklistTokenRepository;
    this.config = config;
    this.tokenService = tokenService;
  }

  public async execute(data: LogoutData): Promise<void> {
    if (!data.refreshToken) {
      return;
    }

    let tokenPayload: TokenPayload;

    try {
      tokenPayload = this.tokenService.verifyRefreshToken(data.refreshToken);
    } catch (error) {
      return;
    }

    const refreshTokenHash = CryptoService.hashData(data.refreshToken);
    const expiresAt = new Date(
      tokenPayload.exp ? tokenPayload.exp * 1000 : Date.now() + this.config.token.refresh.expiresIn * 1000,
    );

    await this.blacklistTokenRepository.createBlacklistToken({
      userId: tokenPayload.userId,
      tokenHash: refreshTokenHash,
      expiresAt,
    });
  }
}
