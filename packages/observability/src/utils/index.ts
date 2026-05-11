import { randomUUID } from "node:crypto";

/**
 * 生成 trace ID
 */
export function generateTraceId(): string {
  return randomUUID();
}

/**
 * 获取当前时间的 ISO 字符串
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * 将未知错误转换为 JSON-safe 的错误记录
 */
export function safeErrorRecord(error: unknown): {
  name: string;
  message: string;
  stack?: string;
  code?: string;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as { code?: string }).code,
    };
  }
  return {
    name: "UnknownError",
    message: String(error),
  };
}

/**
 * 安全调用异步函数，失败时返回 undefined 并可选记录警告
 */
export async function safeInvoke<T>(
  fn: () => T | Promise<T>,
  onError?: (err: unknown) => void
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    onError?.(error);
    return undefined;
  }
}

/**
 * 安全调用同步函数
 */
export function safeInvokeSync<T>(
  fn: () => T,
  onError?: (err: unknown) => void
): T | undefined {
  try {
    return fn();
  } catch (error) {
    onError?.(error);
    return undefined;
  }
}
