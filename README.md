# RAG SDK

一套模块化的 RAG（检索增强生成）开发工具包。提供从文档索引、向量存储、检索编排到生成回答的完整链路，各包可独立使用，也可组合成端到端流水线。

## 安装

```bash
npm install @rag-sdk/core @rag-sdk/runtime @rag-sdk/indexing
# 按需安装适配器与工具包
npm install @rag-sdk/adapters @rag-sdk/observability @rag-sdk/utils
```

> 本项目使用 **pnpm workspace** 管理，内部开发时直接 `pnpm install` 即可拉取全部依赖。

## 核心概念

RAG SDK 将 RAG 流程拆分为两条主线：

| 主线 | 职责 | 对应包 |
|------|------|--------|
| **Indexing（离线）** | 加载文档 → 切分 → 嵌入 → 写入向量库 | `@rag-sdk/indexing` |
| **Runtime（在线）** | 查询预处理 → 检索 → 后处理 → 生成回答 | `@rag-sdk/runtime` |

Runtime 内部采用**四阶段编排**：

1. **Pre-retrieval** — 查询预处理（改写、扩展）
2. **Retrieval** — 从向量库召回相关片段
3. **Post-retrieval** — 结果过滤、去重、重排、预算裁剪
4. **Generation** — 调用 LLM 生成最终回答

---

## 快速开始

下面是一个最小可运行的 RAG 流水线：

```typescript
import { runIndexing, SimpleChunker, MockEmbedder, MemoryVectorStore } from "@rag-sdk/indexing";
import { createRuntime, createDefaultPostprocessor } from "@rag-sdk/runtime";
import type { RuntimeRetriever, RuntimeGenerator } from "@rag-sdk/runtime";

// ========== 1. 索引阶段：把文档写入内存向量库 ==========
const store = new MemoryVectorStore();

await runIndexing({
  loader: {
    async load() {
      return [
        { id: "doc-1", content: "RAG 是一种结合检索和生成的技术。" },
        { id: "doc-2", content: "向量数据库用于存储语义嵌入。" },
      ];
    },
  },
  chunker: new SimpleChunker({ chunkSize: 50, overlap: 10 }),
  embedder: new MockEmbedder({ dimension: 64 }),
  store,
});

// ========== 2. 运行阶段：查询并生成回答 ==========
const retriever: RuntimeRetriever = {
  async retrieve(query) {
    // 实际场景中使用向量相似度检索；这里简化演示
    const all = store.getAll();
    return {
      chunks: all.map((v) => ({
        id: v.id,
        content: String(v.metadata?.source ?? ""),
      })),
    };
  },
};

const generator: RuntimeGenerator = {
  async generate({ query, chunks }) {
    return {
      answer: `关于 "${query.query}" 的回答（基于 ${chunks.length} 个片段）`,
    };
  },
};

const runtime = createRuntime({
  preprocessor: { async preprocess(q) { return { effectiveQuery: q }; } },
  retriever,
  postprocessor: createDefaultPostprocessor({ budget: { maxCandidates: 3 } }),
  generator,
});

const result = await runtime.run({ query: { query: "什么是 RAG" } });
console.log(result.answer);
```

---

## 详细使用指南

### `@rag-sdk/runtime` — 运行时编排

#### 使用默认运行时（最简单）

```typescript
import { createDefaultRuntime } from "@rag-sdk/runtime";

const runtime = createDefaultRuntime({ retriever, generator });
const result = await runtime.run({ query: { query: "用户问题" } });

// result 包含：
// result.answer          — 生成回答
// result.chunks          — 最终选用的片段
// result.originalQuery   — 原始查询
// result.effectiveQuery  — 预处理后查询
// result.retrievedCount  — 召回片段数
// result.finalChunkCount — 后处理后片段数
```

#### 自定义四阶段运行时

```typescript
import { createRuntime } from "@rag-sdk/runtime";

const runtime = createRuntime({
  preprocessor: {
    async preprocess(query) {
      // 例如：查询扩展、拼写纠错
      return { effectiveQuery: { query: query.query + " 相关概念" } };
    },
  },
  retriever,
  postprocessor: createDefaultPostprocessor({
    scoreThreshold: 0.5,       // 过滤低分结果
    budget: { maxCandidates: 5 }, // 最多保留 5 个候选
    nearDuplicate: true,       // 开启近似去重
    sourceCoverage: { maxPerSource: 2 }, // 单一来源最多 2 条
    orderBy: "score",          // 按分数降序排列
    debug: true,               // 输出调试信息
  }),
  generator,
});
```

#### 检索后处理策略详解

`createDefaultPostprocessor` 支持组合以下策略：

| 策略 | 配置项 | 说明 |
|------|--------|------|
| 分数阈值 | `scoreThreshold` | 过滤低于阈值的候选 |
| 预算裁剪 | `budget: { maxCandidates, maxChunks, maxPromptChars }` | 按数量或字符数限制 |
| 近似去重 | `nearDuplicate` | 基于 Jaccard 相似度移除重复内容 |
| 来源覆盖 | `sourceCoverage` | 限制单一来源的条目数，避免垄断 |
| 上下文排序 | `orderBy` | `"retrieval"` / `"score"` / 自定义比较器 |
| 自定义过滤 | `customPredicate` | 传入 `(candidate) => boolean` 进行额外过滤 |

```typescript
import { createDefaultPostprocessor } from "@rag-sdk/runtime";

const postprocessor = createDefaultPostprocessor({
  scoreThreshold: 0.6,
  budget: { maxPromptChars: 2000 },
  nearDuplicate: { similarityThreshold: 0.85 },
  sourceCoverage: { maxPerSource: 3, sourceField: "source" },
  orderBy: (a, b) => b.score - a.score,
  debug: true,
});
```

#### 错误处理

```typescript
import { RuntimeError } from "@rag-sdk/runtime";

try {
  await runtime.run({ query: { query: "test" } });
} catch (error) {
  if (error instanceof RuntimeError) {
    console.error(`阶段 [${error.stage}] 失败:`, error.message);
    console.error("原始查询:", error.query);
    console.error("原始错误:", error.cause);
  }
}
```

---

### `@rag-sdk/indexing` — 文档索引

#### 完整索引流水线

```typescript
import { runIndexing, SimpleChunker, MockEmbedder, MemoryVectorStore } from "@rag-sdk/indexing";
import { MarkdownLoader } from "@rag-sdk/indexing/loaders";

const store = new MemoryVectorStore();

const result = await runIndexing({
  loader: new MarkdownLoader({ path: "./docs" }), // 加载本地 Markdown 文件
  transformers: [
    {
      async transform(doc) {
        // 自定义文档预处理
        return { ...doc, content: doc.content.replace(/\s+/g, " ") };
      },
    },
  ],
  chunker: new SimpleChunker({ chunkSize: 500, overlap: 50 }),
  embedder: new MockEmbedder({ dimension: 128 }),
  store,
  shouldIndex: (doc) => doc.content.length > 0, // 过滤空文档
  metadataBuilder: (doc, chunk) => ({            // 自定义元数据
    documentId: doc.id,
    source: doc.metadata?.source,
  }),
});

console.log(result);
// {
//   documentsTotal: 10,
//   documentsIndexed: 9,
//   chunksTotal: 42,
//   vectorsTotal: 42,
//   skippedDocuments: 0,
//   failedDocuments: 1
// }
```

#### 使用内存向量库进行测试/调试

```typescript
import { MemoryVectorStore } from "@rag-sdk/indexing/stores";

const store = new MemoryVectorStore();
await store.upsert([
  { id: "v1", values: [1, 0, 0], metadata: { tag: "a" } },
  { id: "v2", values: [0, 1, 0], metadata: { tag: "b" } },
]);

// 余弦相似度检索
const results = await store.query({
  queryVector: [1, 0.5, 0],
  topK: 2,
  filter: { tag: "a" }, // 可选：按 metadata 过滤
});

store.clear(); // 清空数据
```

#### 自定义 Embedder

```typescript
import type { Embedder, Chunk, Vector } from "@rag-sdk/indexing";

const myEmbedder: Embedder = {
  async embed(chunks: Chunk[]): Promise<Vector[]> {
    return chunks.map((chunk) => ({
      id: chunk.id,
      values: /* 调用你的 embedding 服务 */ [],
      metadata: chunk.metadata,
    }));
  },
};
```

---

### `@rag-sdk/adapters` — 第三方适配

#### LangChain 适配

```typescript
import { LangChainLoaderAdapter, LangChainChunkerAdapter, LangChainEmbedderAdapter } from "@rag-sdk/adapters/langchain";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { DirectoryLoader, TextLoader } from "langchain/document_loaders/fs";

// Loader 适配
const directoryLoader = new DirectoryLoader("./docs", { ".md": (p) => new TextLoader(p) });
const loader = new LangChainLoaderAdapter(directoryLoader);

// Chunker 适配
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 });
const chunker = new LangChainChunkerAdapter(splitter);

// Embedder 适配
const embeddings = new OpenAIEmbeddings({ modelName: "text-embedding-3-small" });
const embedder = new LangChainEmbedderAdapter(embeddings);
```

#### Chunker 预设

```typescript
import { RecursiveTextSplitter, TokenTextSplitterPreset, MarkdownTextSplitterPreset } from "@rag-sdk/adapters/langchain";

const chunker1 = new RecursiveTextSplitter({ chunkSize: 500, chunkOverlap: 50 });
const chunker2 = new TokenTextSplitterPreset();      // 基于 token 计数
const chunker3 = new MarkdownTextSplitterPreset();   // 针对 Markdown 结构
```

#### Chroma 向量库

```typescript
import { ChromaVectorStore } from "@rag-sdk/adapters/chroma";
import { ChromaClient } from "chromadb";

const client = new ChromaClient({ path: "http://localhost:8000" });
const store = new ChromaVectorStore({
  client,
  collectionName: "my-collection",
  collectionMetadata: { description: "RAG 文档库" },
});

await store.upsert(vectors);
```

---

### `@rag-sdk/observability` — 可观测性

#### 基础 Observer 与 Exporter

```typescript
import { createRAGObserver, createMemoryTraceExporter, createConsoleExporter } from "@rag-sdk/observability";

const memoryExporter = createMemoryTraceExporter();
const observer = createRAGObserver({
  exporters: [memoryExporter, createConsoleExporter({ pretty: true })],
  sampling: { rate: 1, alwaysSampleOnError: true },
  redaction: { fields: ["user.email", "apiKey"], replacement: "[REDACTED]" },
});

// 在业务代码中埋点
await observer.onEvent?.({
  traceId: "trace-1",
  scope: "runtime",
  stage: "retrieval",
  name: "runtime.retrieval.complete",
  timestamp: new Date().toISOString(),
});

// 结束追踪并导出
await observer.onTraceEnd?.({
  traceId: "trace-1",
  scope: "runtime",
  startedAt: "...",
  status: "ok",
  events: [],
});

// 读取已收集的 trace
const traces = memoryExporter.getTraces();
```

#### 脱敏

```typescript
import { applyRedaction } from "@rag-sdk/observability/redaction";

const safe = applyRedaction(
  { user: "alice", email: "alice@example.com", content: "长文本..." },
  { fields: ["email"], maskContent: true, contentPreviewLength: 50 }
);
// safe.email === "[REDACTED]"
// safe.content 被截断并标记 mask
```

---

### `@rag-sdk/core` — 类型与校验

```typescript
import { QuerySchema, ChunkSchema, RAGResponseSchema } from "@rag-sdk/core/spec";
import { ValidationError, RetrievalError, GenerationError } from "@rag-sdk/core/errors";

// 校验输入
const query = QuerySchema.parse({ query: "用户问题" });
const chunk = ChunkSchema.parse({ id: "c1", content: "片段内容" });

// 校验输出
const response = RAGResponseSchema.parse({ answer: "回答", chunks: [chunk] });
```

---

### `@rag-sdk/utils` — 工具函数

```typescript
import { jaccardSimilarity, ngramSet } from "@rag-sdk/utils/text";
import { generateFallbackId, generateChunkId } from "@rag-sdk/utils/id";
import { normalizeMetadata, mergeMetadata } from "@rag-sdk/utils/metadata";
import { buildPromptContext } from "@rag-sdk/utils/formatting";
import { toError, getErrorMessage } from "@rag-sdk/utils/errors";

// 文本相似度
const sim = jaccardSimilarity("hello world", "hello there", 2); // 0~1

// 稳定 ID 生成
const id = generateFallbackId("文档内容"); // 16 位十六进制哈希
const chunkId = generateChunkId("doc-1", 0); // "doc-1-chunk-0"

// Metadata 规范化（移除嵌套对象、BigInt 等）
const meta = normalizeMetadata({ createdAt: new Date(), count: 42n });
// meta.createdAt 转为 ISO 字符串；meta.count 转为 number

// Prompt 上下文拼接
const context = buildPromptContext(
  [{ content: "片段1" }, { content: "片段2" }],
  "\n\n---\n\n"
);
```

---

## CLI 命令

```bash
# 安装依赖
pnpm install

# 类型检查
pnpm run typecheck

# 运行全部单元测试
pnpm run test

# 类型检查 + 单元测试
pnpm run check

# 运行冒烟测试
pnpm run smoke

# 完整验证（类型检查 + 测试 + 冒烟）
pnpm run verify

# 格式化代码
pnpm run format

# 代码检查
pnpm run lint
```

---

## 包清单

| 包名 | 安装 | 说明 |
|------|------|------|
| `@rag-sdk/core` | `npm i @rag-sdk/core` | 类型定义、Zod Schema、接口规范、错误类 |
| `@rag-sdk/runtime` | `npm i @rag-sdk/runtime` | RAG 四阶段运行时编排、检索后处理策略 |
| `@rag-sdk/indexing` | `npm i @rag-sdk/indexing` | 文档索引流水线、切分器、Embedder、向量存储 |
| `@rag-sdk/adapters` | `npm i @rag-sdk/adapters` | LangChain / Chroma 等第三方生态适配 |
| `@rag-sdk/observability` | `npm i @rag-sdk/observability` | 事件追踪、链路导出、数据脱敏、采样 |
| `@rag-sdk/utils` | `npm i @rag-sdk/utils` | 文本相似度、ID 生成、Metadata 规范化、Prompt 构建 |

## 环境要求

- **Node.js**: >= 18.0.0
- **模块系统**: ES Modules (`"type": "module"`)
- **TypeScript**: >= 5.4（如使用 TypeScript）
