import type { IndexingContext } from "../types/indexing-context.js";

/**
 * 索引错误
 */
export class IndexingError extends Error {
  constructor(
    message: string,
    public stage: IndexingContext["stage"]
  ) {
    super(message);
  }
}
