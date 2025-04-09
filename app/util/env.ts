import { z } from "zod";
export const env = z
  .object({
    TEGAMI: z.string(),
    AUTH: z.string(),
  })
  .parse(process.env);
