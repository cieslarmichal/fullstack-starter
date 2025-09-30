import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type, type Static } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';

import { createAuthenticationMiddleware, createAuthorizationMiddleware } from '../../../common/auth/authMiddleware.ts';
import type { TokenService } from '../../../common/auth/tokenService.ts';
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
import { BlacklistTokenRepositoryImpl } from '../infrastructure/repositories/blacklistTokenRepositoryImpl.ts';
import { UserRepositoryImpl } from '../infrastructure/repositories/userRepositoryImpl.ts';

const userSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ minLength: 1, maxLength: 255, format: 'email' }),
  isDeleted: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
});

export async function userRoutes(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fastify: FastifyInstance<any, any, any, any, TypeBoxTypeProvider>,
  {
    config,
    tokenService,
    loggerService,
    database,
  }: {
    database: Database;
    config: Config;
    loggerService: LoggerService;
    tokenService: TokenService;
  },
): Promise<void> {
  const mapUserToResponse = (user: User): Static<typeof userSchema> => {
    const userResponse: Static<typeof userSchema> = {
      id: user.id,
      email: user.email,
      isDeleted: user.isDeleted,
      createdAt: user.createdAt.toISOString(),
    };

    return userResponse;
  };

  const refreshTokenCookie = {
    name: 'refresh-token',
    config: {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: config.token.refresh.expiresIn,
    },
  };

  const userRepository = new UserRepositoryImpl(database);
  const blacklistTokenRepository = new BlacklistTokenRepositoryImpl(database);
  const passwordService = new PasswordService(config);

  const createUserAction = new CreateUserAction(userRepository, loggerService, passwordService);
  const findUserAction = new FindUserAction(userRepository);
  const deleteUserAction = new DeleteUserAction(userRepository, loggerService);
  const loginUserAction = new LoginUserAction(userRepository, loggerService, tokenService, passwordService);
  const refreshTokenAction = new RefreshTokenAction(
    userRepository,
    blacklistTokenRepository,
    config,
    loggerService,
    tokenService,
  );
  const logoutUserAction = new LogoutUserAction(blacklistTokenRepository, config, tokenService);

  const authenticationMiddleware = createAuthenticationMiddleware(tokenService);
  const authorizationMiddleware = createAuthorizationMiddleware();

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
    handler: async (request, reply) => {
      const { email, password } = request.body;

      const result = await loginUserAction.execute({ email, password });

      reply.setCookie(refreshTokenCookie.name, result.refreshToken, refreshTokenCookie.config);

      return reply.send({ accessToken: result.accessToken });
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
        return reply.status(401).send();
      }

      const result = await refreshTokenAction.execute({ refreshToken });

      reply.setCookie(refreshTokenCookie.name, result.refreshToken, refreshTokenCookie.config);

      return reply.send({ accessToken: result.accessToken });
    },
  });

  fastify.delete('/users/:id', {
    schema: {
      params: Type.Object({
        id: Type.String({ format: 'uuid' }),
      }),
      response: {
        204: Type.Null(),
      },
    },
    preHandler: [authenticationMiddleware, authorizationMiddleware],
    handler: async (request, reply) => {
      const { id } = request.params;

      await deleteUserAction.execute(id);

      return reply.status(204).send();
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
}
