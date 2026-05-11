import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import type { Document } from "../types/document.js";
import type { Loader } from "./loader.js";

export type MarkdownLoaderOptions = {
  path: string;
};

/**
 * Markdown 加载器
 *
 * 读取本地目录下的所有 markdown 文件。
 */
export class MarkdownLoader implements Loader {
  private dirPath: string;

  constructor(options: MarkdownLoaderOptions) {
    this.dirPath = options.path;
  }

  async load(): Promise<Document[]> {
    const docs: Document[] = [];
    const entries = readdirSync(this.dirPath);

    for (const entry of entries) {
      const fullPath = join(this.dirPath, entry);
      const stat = statSync(fullPath);

      if (stat.isFile() && extname(entry) === ".md") {
        const content = readFileSync(fullPath, "utf-8");
        docs.push({
          id: entry,
          content,
          metadata: { source: fullPath },
        });
      }
    }

    return docs;
  }
}
