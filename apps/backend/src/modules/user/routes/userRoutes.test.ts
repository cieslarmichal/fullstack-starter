import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../tests/generator.ts';
import { truncateTables } from '../../../../tests/helpers/dbCleanup.ts';
import { closeTestServer, createTestContext } from '../../../../tests/helpers/testServer.ts';
import type { DatabaseClient } from '../../../infrastructure/database/databaseClient.ts';
import { UserRepositoryImpl } from '../infrastructure/repositories/userRepositoryImpl.ts';

import type { LoginResponse, UserDto } from './userSchemas.ts';

describe('User Routes Integration Tests', () => {
  let server: FastifyInstance;
  let databaseClient: DatabaseClient;
  let userRepository: UserRepositoryImpl;

  beforeAll(async () => {
    const testContext = await createTestContext();
    server = testContext.server;
    databaseClient = testContext.databaseClient;
    userRepository = new UserRepositoryImpl(databaseClient);
  });

  afterAll(async () => {
    await closeTestServer();
  });

  beforeEach(async () => {
    await truncateTables(databaseClient);
  });

  describe('POST /users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: Generator.email(),
        password: Generator.password(),
      };

      const response = await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<UserDto>();

      expect(body).toMatchObject({
        email: userData.email,
      });
      expect(body.id).toBeTypeOf('string');
      expect(body.createdAt).toBeTypeOf('string');

      // Verify user was created in database
      const user = await userRepository.findByEmail(userData.email);
      expect(user).toBeDefined();
      expect(user?.email).toBe(userData.email);
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: Generator.password(),
      };

      const response = await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 409 when email already exists', async () => {
      const userData = {
        email: Generator.email(),
        password: Generator.password(),
      };

      // First registration
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Second registration with same email
      const response = await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(409);
    });
  });

  describe('POST /users/login', () => {
    it('should login user and return access token', async () => {
      const userData = {
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user first
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const response = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<LoginResponse>();
      expect(body.accessToken).toBeTypeOf('string');
      expect(body.accessToken.length).toBeGreaterThan(0);

      // Verify refresh token cookie is set
      const cookies = response.cookies;
      const refreshTokenCookie = cookies.find((c) => c.name === 'refresh-token');
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie?.value).toBeTypeOf('string');
      expect(refreshTokenCookie?.value.length).toBeGreaterThan(0);
    });

    it('should return 401 for invalid credentials', async () => {
      const userData = {
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user first
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login with wrong password
      const response = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: 'wrong-password',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 for non-existent user', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: Generator.email(),
          password: Generator.password(),
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /users/logout', () => {
    it('should logout user and clear refresh token cookie', async () => {
      const userData = {
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const cookies = loginResponse.cookies;
      const refreshTokenCookie = cookies.find((c) => c.name === 'refresh-token');

      // Logout
      const response = await server.inject({
        method: 'POST',
        url: '/users/logout',
        cookies: {
          'refresh-token': refreshTokenCookie?.value ?? '',
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify cookie is cleared
      const logoutCookies = response.cookies;
      const clearedCookie = logoutCookies.find((c) => c.name === 'refresh-token');
      expect(clearedCookie?.value).toBe('');
    });
  });

  describe('POST /users/refresh-token', () => {
    it('should refresh access token with valid refresh token', async () => {
      const userData = {
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const cookies = loginResponse.cookies;
      const refreshTokenCookie = cookies.find((c) => c.name === 'refresh-token');

      // Refresh token
      const response = await server.inject({
        method: 'POST',
        url: '/users/refresh-token',
        cookies: {
          'refresh-token': refreshTokenCookie?.value ?? '',
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<LoginResponse>();
      expect(body.accessToken).toBeTypeOf('string');
      expect(body.accessToken.length).toBeGreaterThan(0);

      // Verify new refresh token cookie is set
      const refreshCookies = response.cookies;
      const newRefreshTokenCookie = refreshCookies.find((c) => c.name === 'refresh-token');
      expect(newRefreshTokenCookie).toBeDefined();
      expect(newRefreshTokenCookie?.value).toBeTypeOf('string');
    });

    it('should return 401 when refresh token is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/users/refresh-token',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /users/me', () => {
    it('should return authenticated user profile', async () => {
      const userData = {
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const loginBody = loginResponse.json<LoginResponse>();

      // Get profile
      const response = await server.inject({
        method: 'GET',
        url: '/users/me',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<UserDto>();

      expect(body).toMatchObject({
        email: userData.email,
      });
      expect(body.id).toBeTypeOf('string');
      expect(body.createdAt).toBeTypeOf('string');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/users/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/users/me',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /users/me', () => {
    it('should delete authenticated user account', async () => {
      const userData = {
        email: Generator.email(),
        password: Generator.password(),
      };

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users/register',
        payload: userData,
      });

      // Login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/users/login',
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      const loginBody = loginResponse.json<LoginResponse>();

      // Delete account
      const response = await server.inject({
        method: 'DELETE',
        url: '/users/me',
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`,
        },
      });

      console.log(response.body);

      expect(response.statusCode).toBe(204);

      // Verify user was deleted from database
      const user = await userRepository.findByEmail(userData.email);
      expect(user).toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/users/me',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
