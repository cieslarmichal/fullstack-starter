import { type Static, Type } from '@sinclair/typebox';
import { TransformDecodeCheckError, Value } from '@sinclair/typebox/value';
import config from 'config';

import { ConfigurationError } from '../common/errors/configurationError.ts';
import { type LogLevel, logLevels } from '../common/logger/logLevel.ts';

const configSchema = Type.Object({
  database: Type.Object({ url: Type.String({ minLength: 1 }) }),
  cookie: Type.Object({ secret: Type.String({ minLength: 1 }) }),
  frontendUrl: Type.String({ minLength: 1 }),
  hashSaltRounds: Type.Number({ minimum: 5, maximum: 12 }),
  logLevel: Type.Union([...Object.values(logLevels).map((level) => Type.Literal(level as LogLevel))]),
  token: Type.Object({
    access: Type.Object({
      secret: Type.String({ minLength: 1 }),
      expiresIn: Type.Number({ minimum: 1 }),
    }),
    refresh: Type.Object({
      secret: Type.String({ minLength: 1 }),
      expiresIn: Type.Number({ minimum: 86400 }),
      graceMs: Type.Number({ minimum: 1000, maximum: 10000 }),
      // Short client/API idempotency window for coalescing duplicate refresh requests
      idempotencyMs: Type.Number({ minimum: 100, maximum: 5000 }),
    }),
  }),
  server: Type.Object({
    host: Type.String({ minLength: 1 }),
    port: Type.Number({ minimum: 1, maximum: 65535 }),
  }),
  rateLimit: Type.Object({
    global: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
    register: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
    login: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
    logout: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
    refreshToken: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
    profile: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
    accountDeletion: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
  }),
});

export type Config = Static<typeof configSchema>;

export function createConfig(): Config {
  try {
    return Value.Decode(configSchema, config);
  } catch (error) {
    if (error instanceof TransformDecodeCheckError) {
      throw new ConfigurationError({ originalError: error });
    }

    throw error;
  }
}
