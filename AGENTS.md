# RAG SDK 项目规则

## 文档语言约束（强制）

**所有文档必须使用中文生成。**

这包括但不限于：
- 代码注释
- README 文档
- 设计文档
- API 文档
- 提交信息（commit messages）
- 代码中的字符串和错误提示
- AI 生成的所有输出内容

## 项目结构

- Monorepo 管理：pnpm workspace
- 包位置：`packages/*`
- 每个包必须包含独立的 `package.json`

### 包清单

| 包名 | 路径 | 说明 |
|------|------|------|
| @rag-sdk/core | packages/core | 核心类型、接口、规范 |
| @rag-sdk/runtime | packages/runtime | 运行时组件（检索、重排、生成） |
| @rag-sdk/indexing | packages/indexing | 文档索引管道 |
| @rag-sdk/adapters | packages/adapters | 外部服务适配器 |
| @rag-sdk/observability | packages/observability | 可观测性（钩子、链路追踪、指标） |
| @rag-sdk/eval | packages/eval | 评估框架 |
| @rag-sdk/utils | packages/utils | 工具函数 |

## 开发规范

- 主要语言：TypeScript
- 模块系统：ES Modules (`"type": "module"`)
- 最低 Node 版本：>= 18.0.0
- 包管理器：pnpm

## 常用命令

```bash
# 安装依赖
pnpm install

# 查看所有 workspace 包
pnpm list --filter "@rag-sdk/*"
```

## 重要文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 项目初始化需求 | `01. 项目初始化.md` | 原始需求文档 |
| 交接文档 | `docs/decisions/00-项目交接文档.md` | 项目状态与交接信息 |

## 特殊约束

### docs 目录不上传 Git

`docs/` 目录仅用于 AI 协作和本地开发者阅读，**已加入 `.gitignore`**，不会上传到 Git。

- 如需分享文档，请通过其他方式传递
- 如需在仓库中保留文档，请将文档移至 `packages/*/README.md` 或其他合适位置
