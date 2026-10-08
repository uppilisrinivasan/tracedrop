/**
 * Simple logging utility with multiple levels and structured logging support
 * Integrates with Firebase Cloud Logging in production
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  traceId?: string;
  userId?: string;
}

export interface LoggerConfig {
  minLevel?: LogLevel;
  enableConsole?: boolean;
  enableFirebase?: boolean;
  enableFile?: boolean;
}

class Logger {
  private minLevel: LogLevel = LogLevel.DEBUG;
  private enableConsole: boolean = true;
  private enableFirebase: boolean = false;
  private enableFile: boolean = false;
  private logs: LogEntry[] = [];

  constructor(config?: LoggerConfig) {
    if (config?.minLevel) this.minLevel = config.minLevel;
    if (config?.enableConsole !== undefined) this.enableConsole = config.enableConsole;
    if (config?.enableFirebase !== undefined) this.enableFirebase = config.enableFirebase;
    if (config?.enableFile !== undefined) this.enableFile = config.enableFile;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, userId, traceId } = entry;
    const time = timestamp.toISOString();
    const ctx = context ? ` | ${JSON.stringify(context)}` : '';
    const user = userId ? ` | user:${userId}` : '';
    const trace = traceId ? ` | trace:${traceId}` : '';
    return `[${time}] ${level}: ${message}${user}${trace}${ctx}`;
  }

  private createEntry(level: LogLevel, message: string, options?: {
    context?: Record<string, any>;
    error?: Error;
    traceId?: string;
    userId?: string;
  }): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message,
      context: options?.context,
      error: options?.error,
      traceId: options?.traceId,
      userId: options?.userId,
    };
  }

  debug(message: string, options?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const entry = this.createEntry(LogLevel.DEBUG, message, options);
    this.output(entry);
  }

  info(message: string, options?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const entry = this.createEntry(LogLevel.INFO, message, options);
    this.output(entry);
  }

  warn(message: string, options?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const entry = this.createEntry(LogLevel.WARN, message, options);
    this.output(entry);
  }

  error(message: string, error?: Error, options?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const entry = this.createEntry(LogLevel.ERROR, message, { ...options, error });
    this.output(entry);
  }

  critical(message: string, error?: Error, options?: any): void {
    if (!this.shouldLog(LogLevel.CRITICAL)) return;
    const entry = this.createEntry(LogLevel.CRITICAL, message, { ...options, error });
    this.output(entry);
  }

  private output(entry: LogEntry): void {
    this.logs.push(entry);

    if (this.enableConsole) {
      const formatted = this.formatEntry(entry);
      if (entry.level === LogLevel.ERROR || entry.level === LogLevel.CRITICAL) {
        console.error(formatted);
      } else if (entry.level === LogLevel.WARN) {
        console.warn(formatted);
      } else {
        console.log(formatted);
      }
    }
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new Logger({
  minLevel: process.env.LOG_LEVEL as LogLevel || LogLevel.INFO,
  enableConsole: true,
});

export default logger;
