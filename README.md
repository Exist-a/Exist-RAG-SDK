# RAG SDK

一个完整的 RAG (Retrieval-Augmented Generation) 软件开发工具包。

## 项目状态

**当前阶段**：项目初始化完成 ✅

- [x] Monorepo 目录结构
- [x] pnpm workspace 配置
- [x] Git 仓库初始化
- [ ] 业务逻辑实现
- [ ] 测试覆盖
- [ ] 构建配置

## 技术栈

- **包管理**：pnpm workspace
- **语言**：TypeScript
- **模块系统**：ES Modules
- **Node 版本**：>= 18.0.0

## 快速开始

```bash
# 安装依赖
pnpm install

# 查看所有包
pnpm list --filter "@rag-sdk/*"
```

## 项目结构

```
rag-sdk/
├── packages/          # SDK 核心包
│   ├── core/         # 核心类型、接口
│   ├── runtime/      # 运行时组件
│   ├── indexing/     # 索引管道
│   ├── adapters/     # 外部适配器
│   ├── observability/# 可观测性
│   ├── eval/         # 评估框架
│   └── utils/        # 工具函数
├── docs/             # 文档
└── .vscode/          # VSCode 配置
```

## 包说明

| 包名 | 描述 |
|------|------|
| @rag-sdk/core | 核心类型定义、接口规范 |
| @rag-sdk/runtime | RAG 运行时（检索、重排、生成） |
| @rag-sdk/indexing | 文档索引管道 |
| @rag-sdk/adapters | LLM、向量库等适配器 |
| @rag-sdk/observability | 监控、链路追踪 |
| @rag-sdk/eval | RAG 评估框架 |
| @rag-sdk/utils | 通用工具函数 |

## 文档

- [项目初始化需求](./01.%20项目初始化.md)
- [项目交接文档](./docs/decisions/00-项目交接文档.md)
- [AI 协作规则](./AGENTS.md)

## 约束规则

> **所有文档必须使用中文生成。**

详见 [AGENTS.md](./AGENTS.md)

## Git 提交记录

```
db0ad9d 初始化项目：创建 RAG SDK Monorepo 目录结构
```
