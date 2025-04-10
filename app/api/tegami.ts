import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { isAuthed } from "./login";
import path from "node:path";
import { env } from "~/util/env";
import { existsSync } from "node:fs";
import { TRPCError } from "@trpc/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { checkKey } from "./key";

export const tegami = router({
  exists: publicProcedure
    .input(z.string())
    .output(z.boolean())
    .query(({ input }) => {
      const dir = path.join(env.TEGAMI, input);
      return existsSync(dir);
    }),
  unlock: publicProcedure
    .input(
      z.object({
        id: z.string(),
        key: z.optional(z.string()).nullable(),
      }),
    )
    .output(z.boolean())
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
          return valid;
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
  open: publicProcedure
    .input(
      z.object({
        id: z.string(),
        key: z.optional(z.string()).nullable(),
      }),
    )
    .output(z.string())
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
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: `Invalid key for letter ${input.id}`,
            });
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
  checkKey: publicProcedure
    .input(z.string())
    .output(z.object({ has: z.boolean(), key: z.optional(z.string()) }))
    .query(async ({ input, ctx }) => {
      try {
        const check = await checkKey(input, ctx.req);
        if (check) {
          return check;
        }
      } catch {
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message: `Error parsing key for letter ${input}`,
        });
      }
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No such letter with id ${input}`,
      });
    }),
  create: publicProcedure.output(z.string()).mutation(async ({ ctx }) => {
    if (!isAuthed(ctx.req)) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const [dir, id] = findPath();
    try {
      await mkdir(dir);
      await writeFile(path.join(dir, "index.md"), "");
    } catch (e) {
      throw new TRPCError({
        code: "UNPROCESSABLE_CONTENT",
        message: `Error creating letter: ${e}`,
      });
    }
    return id;
  }),
  save: publicProcedure
    .input(
      z.object({
        id: z.string(),
        letter: z.string(),
        key: z.string().optional(),
      }),
    )
    .output(z.boolean())
    .mutation(({ input, ctx }) => {
      if (!isAuthed(ctx.req)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const dir = path.join(env.TEGAMI, input.id);
      if (!existsSync(dir)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No such letter with id ${input.id}`,
        });
      }
      try {
        writeFile(path.join(dir, "index.md"), input.letter);
        if (input.key) writeFile(path.join(dir, ".key"), input.key);
        return true;
      } catch (e) {
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message: `Failed to save files ${e}`,
        });
      }
    }),
});

function findPath(): [string, string] {
  while (true) {
    const arr = crypto.getRandomValues(new Uint8Array(5));
    const id = Buffer.from(arr).toString("hex");
    const dir = path.join(env.TEGAMI, id);
    if (!existsSync(dir)) return [dir, id];
  }
}
