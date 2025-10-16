import type { FastifyReply, FastifyRequest } from 'fastify';

import { ForbiddenAccessError } from '../errors/forbiddenAccessError.ts';
import { UnauthorizedAccessError } from '../errors/unathorizedAccessError.ts';

import type { TokenService } from './tokenService.ts';

export type AuthMiddleware = (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;

export function createAuthenticationMiddleware(tokenService: TokenService): AuthMiddleware {
  return async function (request: FastifyRequest, _reply: FastifyReply): Promise<void> {
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

export function createParamsAuthorizationMiddleware(): AuthMiddleware {
  return async function (request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new UnauthorizedAccessError({
        reason: 'User not authenticated',
      });
    }

    const userIdFromParams = (request.params as { userId: string }).userId;
    const userIdFromToken = request.user.userId;

    if (userIdFromParams !== userIdFromToken) {
      throw new ForbiddenAccessError({
        reason: 'The user id does not match the user id from the token.',
      });
    }
  };
}
