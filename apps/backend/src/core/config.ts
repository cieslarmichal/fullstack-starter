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
    }),
  }),
  server: Type.Object({
    host: Type.String({ minLength: 1 }),
    port: Type.Number({ minimum: 1, maximum: 65535 }),
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
