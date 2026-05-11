# @rag-sdk/core

RAG SDK 的共享领域契约层，提供类型定义、Zod Schema、接口规范和错误类。

## 安装

```bash
pnpm --filter @rag-sdk/core add zod
```

## 主要导出

### 类型

- `Query` — 查询类型
- `Chunk` — 文本片段类型
- `RAGResponse` — RAG 响应类型

### Schema

- `QuerySchema` — 查询校验规则
- `ChunkSchema` — 片段校验规则（含 metadata 校验）
- `RAGResponseSchema` — 响应校验规则

### 接口

- `Retriever` — 检索器接口
- `Generator` — 生成器接口

### 错误类

- `ValidationError` — 数据校验错误
- `RetrievalError` — 检索错误
- `GenerationError` — 生成错误

## 快速示例

```typescript
import { QuerySchema, ChunkSchema } from "@rag-sdk/core";

// 校验查询
const query = QuerySchema.parse({ query: "什么是 RAG" });

// 校验片段
const chunk = ChunkSchema.parse({
  id: "c1",
  content: "RAG 是一种将检索与生成结合的技术...",
  metadata: { source: "wiki" },
});
```

## 测试

```bash
pnpm --filter @rag-sdk/core test
```
