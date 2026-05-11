import { z } from "zod";

/**
 * Query 校验规则
 */
export const QuerySchema = z.object({
  query: z.string().min(1),
});
