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
        key: z.optional(z.string()).nullable(),
      }),
    )
    .output(z.optional(z.string()))
    .query(async ({ input }) => {
      const dir = path.join(env.TEGAMI, input.id);
      if (existsSync(dir)) {
        try {
          const keypath = path.join(dir, ".key");
          let valid = !existsSync(keypath);
          if (!valid) {
            const fkey = (await readFile(path.join(dir, ".key"))).toString();
            valid = fkey === input.key;
          }
          if (valid) {
            try {
              return (await readFile(path.join(dir, "index.md"))).toString();
            } catch {
              throw new TRPCError({
                code: "UNPROCESSABLE_CONTENT",
                message: `Invalid index.md for letter ${input.id}`,
              });
            }
          } else {
            return;
          }
        } catch {
          throw new TRPCError({
            code: "UNPROCESSABLE_CONTENT",
            message: `Error parsing key for letter ${input.id}`,
          });
        }
      } else {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No such letter with id ${input.id}`,
        });
      }
    }),
  getKey: publicProcedure
    .input(z.string())
    .output(z.optional(z.string()))
    .query(async ({ input, ctx }) => {
      const dir = path.join(env.TEGAMI, input);
      if (existsSync(dir)) {
        const keypath = path.join(dir, ".key");
        if (isAuthed(ctx.req) && existsSync(keypath)) {
          try {
            const fkey = (await readFile(path.join(dir, ".key"))).toString();
            return fkey;
          } catch {
            throw new TRPCError({
              code: "UNPROCESSABLE_CONTENT",
              message: `Error parsing key for letter ${input}`,
            });
          }
        }
        return;
      } else {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No such letter with id ${input}`,
        });
      }
    }),
});
