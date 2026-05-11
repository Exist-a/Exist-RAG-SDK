import { DirectoryLoader, UnknownHandling } from "@langchain/classic/document_loaders/fs/directory";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { LangChainLoaderAdapter } from "./langchain-loader-adapter.js";

export type LangChainMarkdownLoaderOptions = {
  path: string;
};

/**
 * LangChain Markdown 目录加载器
 *
 * 基于 LangChain DirectoryLoader + TextLoader 实现的默认加载方案。
 */
export class LangChainMarkdownLoader extends LangChainLoaderAdapter {
  constructor(options: LangChainMarkdownLoaderOptions) {
    const directoryLoader = new DirectoryLoader(
      options.path,
      {
        ".md": (filePath) => new TextLoader(filePath),
      },
      false,
      UnknownHandling.Ignore
    );

    super(directoryLoader);
  }
}
