import { Document as LCDocument } from "@langchain/core/documents";
import type { Loader } from "@rag-sdk/indexing";
import { fromLangChainDocument } from "../shared/document-mapping.js";

/**
 * LangChain 风格加载器接口
 */
export interface LangChainStyleLoader {
  load(): Promise<LCDocument[]>;
}

/**
 * LangChain 加载器通用适配器
 *
 * 接收任意 LangChain 风格 load() 实现，输出内部 Document[]。
 */
export class LangChainLoaderAdapter implements Loader {
  private lcLoader: LangChainStyleLoader;

  constructor(lcLoader: LangChainStyleLoader) {
    this.lcLoader = lcLoader;
  }

  async load() {
    const lcDocs = await this.lcLoader.load();
    return lcDocs.map(fromLangChainDocument);
  }
}
