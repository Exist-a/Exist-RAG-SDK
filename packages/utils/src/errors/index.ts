/**
 * 将未知错误值规范化为 Error 实例
 *
 * 如果输入已经是 Error 实例则原样返回，否则包装为新的 Error。
 */
export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * 获取未知错误的消息字符串
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * 获取可作为 cause 的 Error 实例
 *
 * 如果输入是 Error 则返回，否则返回 undefined（适用于不需要强制包装的场景）。
 */
export function getErrorCause(error: unknown): Error | undefined {
  return error instanceof Error ? error : undefined;
}
