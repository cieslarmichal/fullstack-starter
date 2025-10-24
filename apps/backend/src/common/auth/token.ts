export interface TokenPayload {
  readonly userId: string;
  readonly email: string;
  readonly iat?: number; // issued at
  readonly exp?: number; // expiration time
}

export interface RefreshTokenPayload extends TokenPayload {
  readonly sessionId: string;
}
