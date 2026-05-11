import type { Document } from "../types/document.js";

/**
 * 文档转换器接口
 */
export interface DocumentTransformer {
  transform(doc: Document): Promise<Document>;
}
