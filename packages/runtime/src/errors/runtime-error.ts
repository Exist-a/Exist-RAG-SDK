/**
 * 运行时错误阶段
 */
export type RuntimeStage =
  | "pre-retrieval"
  | "retrieval"
  | "post-retrieval"
  | "generation";

/**
 * 运行时错误
 */
export class RuntimeError extends Error {
  constructor(
    message: string,
    public stage: RuntimeStage,
    public query?: string,
    public cause?: Error
  ) {
    super(message);
  }
}
