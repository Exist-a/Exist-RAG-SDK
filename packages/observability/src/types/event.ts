/**
 * RAG 事件作用域
 */
export type RAGEventScope = "runtime" | "indexing";

/**
 * RAG 事件动作
 */
export type RAGEventAction =
  | "receive"
  | "preprocess"
  | "start"
  | "complete"
  | "fail"
  | "select"
  | "drop"
  | "store";

/**
 * RAG 事件名称
 *
 * 命名规范：`<scope>.<stage>.<action>`
 */
export type RAGEventName =
  | RuntimeEventName
  | IndexingEventName;

/**
 * Runtime 侧事件名称
 */
export type RuntimeEventName =
  | "runtime.query.receive"
  | "runtime.query.preprocess"
  | "runtime.retrieval.start"
  | "runtime.retrieval.complete"
  | "runtime.retrieval.fail"
  | "runtime.post_retrieval.start"
  | "runtime.post_retrieval.select"
  | "runtime.post_retrieval.fail"
  | "runtime.generation.start"
  | "runtime.generation.complete"
  | "runtime.generation.fail"
  | "runtime.run.complete"
  | "runtime.run.fail";

/**
 * Indexing 侧事件名称
 */
export type IndexingEventName =
  | "indexing.run.start"
  | "indexing.run.complete"
  | "indexing.run.fail"
  | "indexing.load.start"
  | "indexing.load.complete"
  | "indexing.load.fail"
  | "indexing.transform.complete"
  | "indexing.filter.complete"
  | "indexing.chunk.complete"
  | "indexing.filter_chunk.complete"
  | "indexing.embed.complete"
  | "indexing.store.complete";

/**
 * RAG 事件
 */
export type RAGEvent = {
  traceId: string;
  scope: RAGEventScope;
  stage: string;
  name: RAGEventName;
  timestamp: string;
  durationMs?: number;
  attributes?: Record<string, unknown>;
};
