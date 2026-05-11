import type { RAGObserver } from "../types/observer.js";

/**
 * 空观察器
 *
 * 默认行为，不做任何事。用于未启用观测时的兜底。
 */
export const NoopObserver: RAGObserver = {
  async onEvent() {},
  async onError() {},
  async onTraceEnd() {},
  async flush() {},
  async shutdown() {},
};
