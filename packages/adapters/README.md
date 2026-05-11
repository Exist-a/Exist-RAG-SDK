# @rag-sdk/adapters

RAG SDK 的第三方生态适配层，提供 LangChain 和 Chroma 的适配器实现。

## 安装

```bash
pnpm --filter @rag-sdk/adapters add @rag-sdk/core @rag-sdk/indexing
pnpm --filter @rag-sdk/adapters add langchain chromadb @langchain/core @langchain/community @langchain/classic @langchain/textsplitters
```

## 主要导出

### LangChain 适配器

- `LangChainLoaderAdapter` — 文档加载器适配
- `LangChainChunkerAdapter` — 文本切分器适配
- `LangChainEmbedderAdapter` — 嵌入器适配

### Chunker 预设

- `createRecursiveCharacterTextSplitterPreset()` — 递归字符切分
- `createTokenTextSplitterPreset()` — Token 切分
- `createMarkdownTextSplitterPreset()` — Markdown 切分

### Chroma 适配器

- `ChromaVectorStore` — Chroma 向量存储适配

### 共享工具

- Metadata 处理工具函数

## 快速示例

```typescript
import { ChromaVectorStore } from "@rag-sdk/adapters/chroma";
import { LangChainLoaderAdapter } from "@rag-sdk/adapters/langchain";

// 使用 Chroma 向量存储
const store = new ChromaVectorStore({
  collectionName: "my-docs",
  url: "http://localhost:8000",
});

// 使用 LangChain 加载器
const loader = new LangChainLoaderAdapter("./docs/**/*.md");
```

## 测试

```bash
pnpm --filter @rag-sdk/adapters test
```
