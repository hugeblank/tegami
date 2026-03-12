import { z } from "zod";
export const env = z
  .object({
    TEGAMI: z.string().default("data"),
    AUTH: z.string(),
  })
  .parse(process.env);
