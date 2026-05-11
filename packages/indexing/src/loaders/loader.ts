import type { Document } from "../types/document.js";

/**
 * 加载器接口
 */
export interface Loader {
  load(): Promise<Document[]>;
}
