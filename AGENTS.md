# RAG SDK 项目规则

## 文档语言约束

**所有文档必须使用中文生成。**

这包括但不限于：
- 代码注释
- README 文档
- 设计文档
- API 文档
- 提交信息（commit messages）
- 代码中的字符串和错误提示

## 项目结构

- Monorepo 管理：pnpm workspace
- 包位置：`packages/*`
- 每个包必须包含独立的 `package.json`

## 开发规范

- 主要语言：TypeScript
- 模块系统：ES Modules (`"type": "module"`)
- 最低 Node 版本：>= 18.0.0
