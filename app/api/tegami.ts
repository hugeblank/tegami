import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { isAuthed } from "~/routes/admin/login";
import path from "node:path";
import { env } from "~/util/env";
import { existsSync } from "node:fs";
import { TRPCError } from "@trpc/server";
import { readFile } from "node:fs/promises";

export const tegami = router({
  open: publicProcedure
    .input(
      z.object({
        id: z.string(),
        key: z.string(),
      }),
    )
    .output(z.optional(z.string()))
    .query(async ({ input, ctx }) => {
      const dir = path.join(env.TEGAMI, input.id);
      if (existsSync(dir)) {
        if (isAuthed(ctx.req) || input.key) {
          try {
            return (await readFile(path.join(dir, "index.md"))).toString();
          } catch {
            throw new TRPCError({
              code: "UNPROCESSABLE_CONTENT",
              message: `Invalid index.md for letter id ${input.id}`,
            });
          }
        } else {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }
      } else {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No such letter with id ${input.id}`,
        });
      }
    }),
});
