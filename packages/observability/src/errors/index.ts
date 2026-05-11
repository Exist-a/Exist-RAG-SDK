/**
 * Observability 内部错误
 *
 * 用于标识 observer / exporter 内部的故障，不应中断业务主流程。
 */
export class ObservabilityError extends Error {
  constructor(
    message: string,
    public readonly stage: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ObservabilityError";
  }
}
