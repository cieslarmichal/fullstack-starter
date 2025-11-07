import { type Logger as PinoLogger } from 'pino';

interface LogPayload {
  readonly message: string;
  readonly event?: string;
  readonly [key: string]: unknown;
}

export class LoggerService {
  private readonly pinoLogger: PinoLogger;

  public constructor(pinoLogger: PinoLogger) {
    this.pinoLogger = pinoLogger;
  }

  public error(payload: LogPayload): void {
    const { message, event, ...context } = payload;

    this.pinoLogger.error({ ...context, event }, message);
  }

  public warn(payload: LogPayload): void {
    const { message, event, ...context } = payload;

    this.pinoLogger.warn({ ...context, event }, message);
  }

  public info(payload: LogPayload): void {
    const { message, event, ...context } = payload;

    this.pinoLogger.info({ ...context, event }, message);
  }

  public debug(payload: LogPayload): void {
    const { message, event, ...context } = payload;

    this.pinoLogger.debug({ ...context, event }, message);
  }
}
