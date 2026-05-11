import { test, expect } from "vitest";
import { createRuntime, RuntimeError } from "../src/index.js";

test("pre-retrieval 阶段错误", async () => {
  const runtime = createRuntime({
    preprocessor: {
      async preprocess() {
        throw new Error("预处理失败");
      },
    },
    retriever: { async retrieve() { return { chunks: [] }; } },
    postprocessor: {
      async postprocess(_q, chunks) {
        return { chunks };
      },
    },
    generator: { async generate() { return { answer: "" }; } },
  });

  await expect(
    runtime.run({ query: { query: "test" } })
  ).rejects.toSatisfy((error: unknown) => {
    return (
      error instanceof RuntimeError &&
      error.stage === "pre-retrieval" &&
      error.message.includes("预处理失败")
    );
  });
});

test("retrieval 阶段错误", async () => {
  const runtime = createRuntime({
    preprocessor: {
      async preprocess(query) {
        return { effectiveQuery: query };
      },
    },
    retriever: {
      async retrieve() {
        throw new Error("检索失败");
      },
    },
    postprocessor: {
      async postprocess(_q, chunks) {
        return { chunks };
      },
    },
    generator: { async generate() { return { answer: "" }; } },
  });

  await expect(
    runtime.run({ query: { query: "test" } })
  ).rejects.toSatisfy((error: unknown) => {
    return (
      error instanceof RuntimeError &&
      error.stage === "retrieval" &&
      error.message.includes("检索失败")
    );
  });
});

test("post-retrieval 阶段错误", async () => {
  const runtime = createRuntime({
    preprocessor: {
      async preprocess(query) {
        return { effectiveQuery: query };
      },
    },
    retriever: { async retrieve() { return { chunks: [] }; } },
    postprocessor: {
      async postprocess() {
        throw new Error("后处理失败");
      },
    },
    generator: { async generate() { return { answer: "" }; } },
  });

  await expect(
    runtime.run({ query: { query: "test" } })
  ).rejects.toSatisfy((error: unknown) => {
    return (
      error instanceof RuntimeError &&
      error.stage === "post-retrieval" &&
      error.message.includes("后处理失败")
    );
  });
});

test("generation 阶段错误", async () => {
  const runtime = createRuntime({
    preprocessor: {
      async preprocess(query) {
        return { effectiveQuery: query };
      },
    },
    retriever: { async retrieve() { return { chunks: [] }; } },
    postprocessor: {
      async postprocess(_q, chunks) {
        return { chunks };
      },
    },
    generator: {
      async generate() {
        throw new Error("生成失败");
      },
    },
  });

  await expect(
    runtime.run({ query: { query: "test" } })
  ).rejects.toSatisfy((error: unknown) => {
    return (
      error instanceof RuntimeError &&
      error.stage === "generation" &&
      error.message.includes("生成失败")
    );
  });
});

test("RuntimeError 携带 query 上下文", async () => {
  const error = new RuntimeError(
    "测试错误",
    "retrieval",
    "测试查询",
    new Error("原始错误")
  );

  expect(error.stage).toBe("retrieval");
  expect(error.query).toBe("测试查询");
  expect(error.cause?.message).toBe("原始错误");
});
