# @rag-sdk/observability

RAG SDK 的可观测性模块，提供 RAG 链路观测与诊断能力。

## 定位

`observability` 不是普通日志包，而是用于结构化记录 RAG 运行时证据：

- 用户原始 query、改写后的 query
- 检索请求参数、filters、topK、score threshold
- 召回候选 chunk、score、source、metadata
- post-retrieval 的过滤、去重、排序、budget trim、source coverage 决策
- selected / dropped candidates 与 dropped reasons
- 最终进入 generator 的 context 摘要
- generator 输入输出摘要、token、latency、错误
- indexing 的 load、transform、chunk、embed、store 阶段统计

它回答三个核心问题：
1. 为什么答成这样？
2. 哪里慢 / 哪里失败？
3. 质量怎么持续改进？

## 设计原则

- **独立包**：不进入 core，不影响最小 RAG 流程
- **可选启用**：不传 observer 时行为不变
- **低侵入集成**：runtime / indexing 通过可选配置接入
- **统一事件协议**：`<scope>.<stage>.<action>`
- **不绑定第三方平台**：内置 console / memory exporter，OpenTelemetry / LangSmith / Phoenix 由 adapters 承载

## 安装

```bash
pnpm --filter @rag-sdk/observability add @rag-sdk/core
```

## 核心概念

### 事件协议

事件命名规范：`<scope>.<stage>.<action>`

```text
runtime.query.receive
runtime.query.preprocess
runtime.retrieval.complete
runtime.post_retrieval.select
runtime.generation.complete
runtime.run.fail

indexing.run.start
indexing.load.complete
indexing.chunk.complete
indexing.embed.complete
indexing.store.complete
```

### Trace

一次 `runtime.run()` 或 `runIndexing()` 的顶层观测单元，包含：
- `traceId` — 观测标识
- `events[]` — 阶段事件列表
- `errors[]` — 错误记录
- `metrics[]` — 指标（latency、token 等）
- `tags` — 业务维度（app、channel、tenant）

## 快速开始

### 最小接入：ConsoleObserver

```typescript
import { createDefaultRuntime } from "@rag-sdk/runtime";
import { createConsoleObserver } from "@rag-sdk/observability";

const observer = createConsoleObserver({ level: "info" });

const runtime = createDefaultRuntime({
  retriever,
  generator,
});

// 手动触发观测（当前 runtime 尚未内置 observer 接入点）
// 未来版本将通过 runtime 配置自动触发
```

### 组合型 Observer（推荐）

```typescript
import {
  createRAGObserver,
  createConsoleExporter,
  createMemoryTraceExporter,
} from "@rag-sdk/observability";

const memoryExporter = createMemoryTraceExporter();

const observer = createRAGObserver({
  exporters: [
    createConsoleExporter({ pretty: true }),
    memoryExporter,
  ],
  redaction: {
    fields: ["user.email"],
    maskContent: true,
    contentPreviewLength: 200,
  },
  sampling: {
    rate: 1,
    alwaysSampleOnError: true,
  },
});

// 使用 memoryExporter 复盘
const traces = memoryExporter.getTraces();
console.log(traces[0].events);
```

### NoopObserver（无观测开销）

```typescript
import { NoopObserver } from "@rag-sdk/observability";

const observer = NoopObserver; // 默认行为，零开销
```

## 主要导出

### 类型

- `RAGEvent` / `RAGTrace` / `RAGMetric` / `RAGErrorRecord`
- `RAGObserver` — 观察器接口
- `TraceExporter` — 导出器接口
- `RuntimeEventName` / `IndexingEventName` — 事件名称联合类型

### Observer

- `NoopObserver` — 空实现
- `createConsoleObserver(options?)` — 控制台输出
- `createRAGObserver(config?)` — 组合 redaction + sampling + exporters

### Exporter

- `createConsoleExporter(options?)` — JSON 格式输出到 console
- `createMemoryTraceExporter()` — 内存存储，支持 `getTraces()` / `clear()`
- `createNoopExporter()` — 空 exporter

### Redaction

- `applyRedaction(data, options?)` — 字段脱敏、content preview

### Sampling

- `shouldSample(trace, options?)` — trace 级采样决策

## 测试

```bash
pnpm --filter @rag-sdk/observability test
```

## 当前限制

- **runtime / indexing 尚未内置 observer 接入点**：当前 observer 需手动调用，未来 Phase 2 将通过 `createRuntime({ observer })` 自动集成。
- **无 HTTP / JSONL exporter**：内置 console 和 memory exporter，HTTP / JSONL 为后续扩展。
- **无第三方平台绑定**：OpenTelemetry / LangSmith / Phoenix 由 adapters 或独立集成包承载。

## 扩展方向

- runtime / indexing 内置 observer 接入点
- HTTP / JSONL exporter
- OpenTelemetry / LangSmith / Phoenix adapter
- Eval 数据闭环（trace → 样本 → 评测）
