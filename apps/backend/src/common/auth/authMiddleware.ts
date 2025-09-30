import type { FastifyReply, FastifyRequest } from 'fastify';

import { ForbiddenAccessError } from '../errors/forbiddenAccessError.ts';
import { UnauthorizedAccessError } from '../errors/unathorizedAccessError.ts';

import type { TokenService } from './tokenService.ts';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    email: string;
  };
}

export function createAuthenticationMiddleware(tokenService: TokenService) {
  return async function (request: AuthenticatedRequest, _reply: FastifyReply): Promise<void> {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new UnauthorizedAccessError({
        reason: 'Authorization header is required',
      });
    }

    const [bearer, token] = authorizationHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedAccessError({
        reason: 'Invalid authorization header format. Expected: Bearer <token>',
      });
    }

    const tokenPayload = tokenService.verifyAccessToken(token);

    request.user = {
      userId: tokenPayload.userId,
      email: tokenPayload.email,
    };
  };
}

export function createAuthorizationMiddleware() {
  return async function (request: AuthenticatedRequest, _reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new UnauthorizedAccessError({
        reason: 'User not authenticated',
      });
    }

    const userIdFromParams = (request.params as { id: string }).id;
    const userIdFromQuery = (request.query as { userId: string }).userId;

    const currentUserId = request.user.userId;

    if (userIdFromParams && currentUserId !== userIdFromParams) {
      throw new ForbiddenAccessError({
        reason: 'You can only modify your own user data',
        userId: currentUserId,
        targetUserId: userIdFromParams,
      });
    }

    if (userIdFromQuery && currentUserId !== userIdFromQuery) {
      throw new ForbiddenAccessError({
        reason: 'You can only access your own user data',
        userId: currentUserId,
        targetUserId: userIdFromQuery,
      });
    }
  };
}
