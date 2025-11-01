import { Type, type Static } from '@fastify/type-provider-typebox';

export const userSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ minLength: 1, maxLength: 255, format: 'email' }),
  createdAt: Type.String({ format: 'date-time' }),
});

export const registerRequestSchema = Type.Object({
  email: Type.String({ minLength: 1, maxLength: 255, format: 'email' }),
  password: Type.String({ minLength: 8, maxLength: 64 }),
});

export const loginRequestSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8, maxLength: 64 }),
});

export const loginResponseSchema = Type.Object({
  accessToken: Type.String(),
});

export const refreshTokenResponseSchema = Type.Object({
  accessToken: Type.String(),
});

export const changePasswordRequestSchema = Type.Object({
  oldPassword: Type.String(),
  newPassword: Type.String(),
});

export type UserDto = Static<typeof userSchema>;
export type RegisterRequest = Static<typeof registerRequestSchema>;
export type LoginRequest = Static<typeof loginRequestSchema>;
export type LoginResponse = Static<typeof loginResponseSchema>;
export type RefreshTokenResponse = Static<typeof refreshTokenResponseSchema>;
export type ChangePasswordRequest = Static<typeof changePasswordRequestSchema>;
