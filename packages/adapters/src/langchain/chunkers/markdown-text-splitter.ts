import { MarkdownTextSplitter } from "@langchain/textsplitters";
import { LangChainChunkerAdapter } from "./langchain-chunker-adapter.js";

export type MarkdownTextSplitterOptions = {
  chunkSize?: number;
  chunkOverlap?: number;
};

/**
 * Markdown 切分预设
 */
export class MarkdownTextSplitterPreset extends LangChainChunkerAdapter {
  constructor(options: MarkdownTextSplitterOptions = {}) {
    const splitter = new MarkdownTextSplitter({
      chunkSize: options.chunkSize ?? 500,
      chunkOverlap: options.chunkOverlap ?? 50,
    });

    super(splitter);
  }
}
