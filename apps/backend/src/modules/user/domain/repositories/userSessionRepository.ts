import type { UserSession } from '../types/userSession.ts';

export interface CreateUserSessionData {
  readonly id?: string;
  readonly userId: string;
  readonly currentRefreshHash: string;
}

export interface RotateWithGraceData {
  readonly sessionId: string;
  readonly newRefreshHash: string;
  readonly graceMs: number;
  readonly now?: Date;
}

export interface AcceptPreviousData {
  readonly sessionId: string;
  readonly presentedHash: string;
  readonly now?: Date;
}

export interface UserSessionRepository {
  create(data: CreateUserSessionData): Promise<UserSession>;
  findById(sessionId: string): Promise<UserSession | null>;
  findByCurrentHash(tokenHash: string): Promise<UserSession | null>;
  getByIdForUpdate(sessionId: string): Promise<UserSession | null>;
  rotateWithGrace(data: RotateWithGraceData): Promise<UserSession>;
  acceptPreviousIfWithinGrace(data: AcceptPreviousData): Promise<boolean>;
  revoke(sessionId: string): Promise<void>;
}
