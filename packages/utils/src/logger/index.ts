/**
 * 日志记录器
 *
 * 提供简单的控制台日志输出，支持不同日志级别。
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

export type Logger = {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
};

function createConsoleLogger(prefix = "RAG-SDK"): Logger {
  const format = (level: LogLevel, message: string) => `[${prefix}] [${level.toUpperCase()}] ${message}`;

  return {
    debug(message, ...args) {
      console.debug(format("debug", message), ...args);
    },
    info(message, ...args) {
      console.info(format("info", message), ...args);
    },
    warn(message, ...args) {
      console.warn(format("warn", message), ...args);
    },
    error(message, ...args) {
      console.error(format("error", message), ...args);
    },
  };
}

let defaultLogger: Logger | undefined;

export function getLogger(): Logger {
  if (!defaultLogger) {
    defaultLogger = createConsoleLogger();
  }
  return defaultLogger;
}

export function setLogger(logger: Logger): void {
  defaultLogger = logger;
}
