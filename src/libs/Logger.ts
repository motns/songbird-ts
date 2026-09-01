export interface Logger {
  fatal(message: string, error?: Error, meta?: Record<string, any>): void;
  error(message: string, error?: Error, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
  trace(message: string, meta?: Record<string, any>): void;
  silly(message: string, meta?: Record<string, any>): void;
}

export class SilentLogger implements Logger {
  fatal(): void {}
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
  trace(): void {}
  silly(): void {}
}

export const defaultLogger = new SilentLogger();
