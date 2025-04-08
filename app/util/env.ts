import { z } from "zod";
export const env = z
  .object({
    TEGAMI: z.string(),
  })
  .parse(process.env);
