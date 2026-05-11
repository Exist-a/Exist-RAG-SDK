import type { Query } from "../types/query.js";
import type { RAGResponse } from "../types/rag-response.js";

/**
 * RAG 流水线类型抽象
 */
export type RAGPipeline = (query: Query) => Promise<RAGResponse>;
