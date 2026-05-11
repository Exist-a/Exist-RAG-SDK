/**
 * 索引执行上下文
 */
export type IndexingContext = {
  documentId?: string;
  stage:
    | "load"
    | "transform"
    | "filter"
    | "chunk"
    | "metadata"
    | "embed"
    | "store";
};
