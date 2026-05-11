# @rag-sdk/indexing

RAG SDK 的离线索引流水线，提供文档加载、切分、嵌入和存储的完整流程。

## 安装

```bash
pnpm --filter @rag-sdk/indexing add @rag-sdk/core
```

## 主要导出

### Pipeline

- `runIndexing()` — 索引主流程
- `IndexingResult` — 索引结果类型
- `IndexingContext` — 索引上下文类型
- `IndexingError` — 索引错误类

### 组件

- `SimpleChunker` — 简单文本切分器
- `MockEmbedder` — 模拟嵌入器（用于测试）
- `MemoryVectorStore` — 内存向量存储
- `MarkdownLoader` — Markdown 文档加载器

## 快速示例

```typescript
import { runIndexing } from "@rag-sdk/indexing";
import { MarkdownLoader } from "@rag-sdk/indexing/loaders";
import { SimpleChunker } from "@rag-sdk/indexing/chunkers";
import { MockEmbedder } from "@rag-sdk/indexing/embedders";
import { MemoryVectorStore } from "@rag-sdk/indexing/stores";

const result = await runIndexing({
  loader: new MarkdownLoader("./docs"),
  chunker: new SimpleChunker({ chunkSize: 500, chunkOverlap: 50 }),
  embedder: new MockEmbedder(),
  store: new MemoryVectorStore(),
});

console.log(`索引完成，共 ${result.chunkCount} 个片段`);
```

## 测试

```bash
pnpm --filter @rag-sdk/indexing test
```
