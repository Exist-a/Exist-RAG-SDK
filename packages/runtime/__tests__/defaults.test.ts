import { test, expect } from "vitest";
import {
  NoopQueryPreprocessor,
  PassthroughRetrievalPostprocessor,
} from "../src/index.js";

test("NoopQueryPreprocessor 不改写 query", async () => {
  const preprocessor = new NoopQueryPreprocessor();
  const result = await preprocessor.preprocess(
    { query: "原始问题" },
    {}
  );

  expect(result.effectiveQuery.query).toBe("原始问题");
  expect(result.topK).toBe(5);
});

test("PassthroughRetrievalPostprocessor 直接透传", async () => {
  const postprocessor = new PassthroughRetrievalPostprocessor();
  const chunks = [
    { id: "c1", content: "片段1" },
    { id: "c2", content: "片段2" },
  ];

  const result = await postprocessor.postprocess(
    { query: "test" },
    chunks,
    {}
  );

  expect(result.chunks).toEqual(chunks);
  expect(result.promptContext).toBe("片段1\n\n片段2");
});

test("PassthroughRetrievalPostprocessor 空 chunks", async () => {
  const postprocessor = new PassthroughRetrievalPostprocessor();
  const result = await postprocessor.postprocess(
    { query: "test" },
    [],
    {}
  );

  expect(result.chunks).toEqual([]);
  expect(result.promptContext).toBe("");
});
