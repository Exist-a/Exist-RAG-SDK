/**
 * 校验错误
 */
export class ValidationError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * 检索错误
 */
export class RetrievalError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "RetrievalError";
  }
}

/**
 * 生成错误
 */
export class GenerationError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "GenerationError";
  }
}
