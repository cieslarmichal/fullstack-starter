import { Type, type Static, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import {
  createAuthenticationMiddleware,
  createParamsAuthorizationMiddleware,
} from '../../../common/auth/authMiddleware.ts';
import type { TokenService } from '../../../common/auth/tokenService.ts';
import { CryptoService } from '../../../common/crypto/cryptoService.ts';
import { UnauthorizedAccessError } from '../../../common/errors/unathorizedAccessError.ts';
import type { LoggerService } from '../../../common/logger/loggerService.ts';
import type { Config } from '../../../core/config.ts';
import type { Database } from '../../../infrastructure/database/database.ts';
import { CreateUserAction } from '../application/actions/createUserAction.ts';
import { DeleteUserAction } from '../application/actions/deleteUserAction.ts';
import { FindUserAction } from '../application/actions/findUserAction.ts';
import { LoginUserAction } from '../application/actions/loginUserAction.ts';
import { LogoutUserAction } from '../application/actions/logoutUserAction.ts';
import { RefreshTokenAction } from '../application/actions/refreshTokenAction.ts';
import { PasswordService } from '../application/services/passwordService.ts';
import type { User } from '../domain/types/user.ts';
import { UserRepositoryImpl } from '../infrastructure/repositories/userRepositoryImpl.ts';
import { UserSessionRepositoryImpl } from '../infrastructure/repositories/userSessionRepositoryImpl.ts';

const userSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ minLength: 1, maxLength: 255, format: 'email' }),
  createdAt: Type.String({ format: 'date-time' }),
});

const appEnvironment = process.env['NODE_ENV'];

export const userRoutes: FastifyPluginAsyncTypebox<{
  database: Database;
  config: Config;
  loggerService: LoggerService;
  tokenService: TokenService;
}> = async function (fastify, opts) {
  const { config, database, loggerService, tokenService } = opts;

  // Idempotency window and single-flight coordination for refresh calls
  // Keyed by refresh token hash to avoid storing sensitive data.
  const inFlightRefreshes = new Map<string, Promise<{ accessToken: string; refreshToken: string }>>();
  const recentRefreshes = new Map<
    string,
    { result: { accessToken: string; refreshToken: string }; timestamp: number }
  >();

  const mapUserToResponse = (user: User): Static<typeof userSchema> => {
    const userResponse: Static<typeof userSchema> = {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };

    return userResponse;
  };

  const refreshTokenCookie = {
    name: 'refresh-token',
    config: {
      httpOnly: true,
      secure: appEnvironment !== 'development',
      sameSite: appEnvironment === 'production' ? ('strict' as const) : ('none' as const),
      path: '/',
      maxAge: config.token.refresh.expiresIn,
    },
  };

  const userRepository = new UserRepositoryImpl(database);
  const userSessionRepository = new UserSessionRepositoryImpl(database);
  const passwordService = new PasswordService(config);

  const createUserAction = new CreateUserAction(userRepository, loggerService, passwordService);
  const findUserAction = new FindUserAction(userRepository);
  const deleteUserAction = new DeleteUserAction(userRepository, loggerService);
  const loginUserAction = new LoginUserAction(
    userRepository,
    loggerService,
    tokenService,
    passwordService,
    userSessionRepository,
  );
  const refreshTokenAction = new RefreshTokenAction(
    userRepository,
    userSessionRepository,
    loggerService,
    tokenService,
    config,
  );
  const logoutUserAction = new LogoutUserAction(userSessionRepository, tokenService);

  const authenticationMiddleware = createAuthenticationMiddleware(tokenService);
  const authorizationMiddleware = createParamsAuthorizationMiddleware();

  fastify.post('/users/register', {
    schema: {
      body: Type.Object({
        email: Type.String({ minLength: 1, maxLength: 255, format: 'email' }),
        password: Type.String({ minLength: 8, maxLength: 64 }),
      }),
      response: {
        201: userSchema,
      },
    },
    config: {
      rateLimit: config.rateLimit.auth,
    },
    handler: async (request, reply) => {
      const user = await createUserAction.execute({
        email: request.body.email,
        password: request.body.password,
      });

      return reply.status(201).send(mapUserToResponse(user));
    },
  });

  fastify.get('/users/me', {
    schema: {
      response: {
        200: userSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const userId = (request as typeof request & { user: { userId: string } }).user.userId;

      const user = await findUserAction.execute(userId);

      return reply.send(mapUserToResponse(user));
    },
  });

  fastify.post('/users/login', {
    schema: {
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        password: Type.String({ minLength: 8, maxLength: 64 }),
      }),
      response: {
        200: Type.Object({ accessToken: Type.String() }),
      },
    },
    config: {
      rateLimit: config.rateLimit.auth,
    },
    handler: async (request, reply) => {
      const { email, password } = request.body;

      const result = await loginUserAction.execute({ email, password });

      reply.setCookie(refreshTokenCookie.name, result.refreshToken, refreshTokenCookie.config);

      return reply.send({ accessToken: result.accessToken });
    },
  });

  fastify.post('/users/logout', {
    schema: {
      response: {
        204: Type.Null(),
      },
    },
    handler: async (request, reply) => {
      const refreshToken = request.cookies[refreshTokenCookie.name];

      await logoutUserAction.execute({ refreshToken });

      reply.clearCookie(refreshTokenCookie.name, { path: refreshTokenCookie.config.path });

      return reply.status(204).send();
    },
  });

  fastify.post('/users/refresh-token', {
    schema: {
      response: {
        200: Type.Object({ accessToken: Type.String() }),
      },
    },
    handler: async (request, reply) => {
      const refreshToken = request.cookies[refreshTokenCookie.name];

      if (!refreshToken) {
        throw new UnauthorizedAccessError({
          reason: 'Refresh token cookie not found',
        });
      }

      const tokenHash = CryptoService.hashData(refreshToken);

      // Short-circuit for very recent duplicate refresh attempts (e.g., rapid page reloads)
      const recent = recentRefreshes.get(tokenHash);
      const now = Date.now();
      if (recent && now - recent.timestamp <= config.token.refresh.graceMs) {
        reply.setCookie(refreshTokenCookie.name, recent.result.refreshToken, refreshTokenCookie.config);
        return reply.send({ accessToken: recent.result.accessToken });
      }

      // Ensure single-flight per tokenHash
      let promise = inFlightRefreshes.get(tokenHash);
      if (!promise) {
        promise = refreshTokenAction.execute({ refreshToken });
        inFlightRefreshes.set(tokenHash, promise);
      }

      let result: { accessToken: string; refreshToken: string };
      try {
        result = await promise;

        // Cache result briefly for idempotency window
        recentRefreshes.set(tokenHash, { result, timestamp: now });

        // Opportunistic cleanup of stale recent entries
        for (const [key, entry] of recentRefreshes) {
          if (now - entry.timestamp > config.token.refresh.graceMs) {
            recentRefreshes.delete(key);
          }
        }
      } finally {
        inFlightRefreshes.delete(tokenHash);
      }

      reply.setCookie(refreshTokenCookie.name, result.refreshToken, refreshTokenCookie.config);
      return reply.send({ accessToken: result.accessToken });
    },
  });

  fastify.delete('/users/:userId', {
    schema: {
      params: Type.Object({
        userId: Type.String({ format: 'uuid' }),
      }),
      response: {
        204: Type.Null(),
      },
    },
    preHandler: [authenticationMiddleware, authorizationMiddleware],
    handler: async (request, reply) => {
      const { userId } = request.params;

      await deleteUserAction.execute(userId);

      return reply.status(204).send();
    },
  });
};
