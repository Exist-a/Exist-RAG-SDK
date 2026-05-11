# 集成测试

本目录用于存放跨包协同的集成测试。

## 当前状态

集成测试尚未实现。当前项目处于早期阶段，各包已通过单元测试和 Demo 脚本验证基本功能。

## 计划中的集成测试场景

1. **indexing → adapters → runtime 完整链路**
   - 使用 adapters 的 LangChain loader 加载文档
   - 使用 indexing 的 pipeline 构建索引
   - 使用 runtime 执行查询并生成回答

2. **core Schema 在全链路中的一致性**
   - 验证 Chunk/Query 类型在各包间的传递一致性

3. **错误边界跨包传递**
   - 验证 indexing 阶段的错误不会泄露到 runtime 阶段

## 运行方式

```bash
# 运行集成测试
vitest run tests/integration
```

---

*待实现*
