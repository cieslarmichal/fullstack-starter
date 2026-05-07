import { Type, type Static } from '@fastify/type-provider-typebox';

export const userSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ minLength: 1, maxLength: 255, format: 'email' }),
  isEmailVerified: Type.Boolean(),
  isDeleted: Type.Boolean(),
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

export const verifyEmailRequestSchema = Type.Object({
  token: Type.String({ minLength: 1 }),
});

export const resendVerificationRequestSchema = Type.Object({
  email: Type.String({ format: 'email' }),
});

export const sendResetPasswordEmailRequestSchema = Type.Object({
  email: Type.String({ format: 'email' }),
});

export const changePasswordByTokenRequestSchema = Type.Object({
  token: Type.String({ minLength: 1 }),
  newPassword: Type.String({ minLength: 8, maxLength: 64 }),
});

export const validateOneTimeTokenRequestSchema = Type.Object({
  token: Type.String({ minLength: 1 }),
  purpose: Type.Union([Type.Literal('email-verification'), Type.Literal('reset-password')]),
});

export const validateOneTimeTokenResponseSchema = Type.Object({
  valid: Type.Boolean(),
});

export type UserDto = Static<typeof userSchema>;
export type RegisterRequest = Static<typeof registerRequestSchema>;
export type LoginRequest = Static<typeof loginRequestSchema>;
export type LoginResponse = Static<typeof loginResponseSchema>;
export type RefreshTokenResponse = Static<typeof refreshTokenResponseSchema>;
