import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { env } from "~/util/env";
import { z } from "zod";

export type KeyCheck = { has: boolean; key?: string };

const rawMetadata = z.object({
  title: z.string().max(128).optional(),
  key: z.string().max(1024).optional(),
});

export const letterMetadata = z.preprocess(
  (val) => {
    const out = rawMetadata.parse(val);
    return {
      ...out,
      has: out.key ? true : false,
    };
  },
  z.object({
    title: z.string().max(128).optional(),
    key: z.string().max(1024).optional(),
    has: z.boolean(),
  }),
);

export type LetterMetadata = z.infer<typeof letterMetadata>;

export async function getMetadata(letterID: string) {
  if (!letterExists(letterID)) throw new Error(`No such letter ${letterID}`);
  return await letterMetadata.parseAsync(
    JSON.parse(
      (
        await readFile(path.join(env.TEGAMI, letterID, ".meta.json"))
      ).toString(),
    ),
  );
}

export function letterExists(id: string) {
  const dir = path.join(env.TEGAMI, id);
  return existsSync(dir);
}
