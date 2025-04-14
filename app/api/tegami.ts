import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { isAuthed } from "./login";
import path from "node:path";
import { env } from "~/util/env";
import { existsSync } from "node:fs";
import { TRPCError } from "@trpc/server";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { checkKey, letterExists } from "../util/misc";
import { findPath } from "~/util/naming";
import { fileTypeFromBuffer } from "file-type";

function identifier() {
  return z.string().regex(/[0-9a-f]{10}/);
}

function fileName() {
  return z.string().regex(/[0-9a-f]{10}\.[0-9a-z]{2,4}/);
}

export const tegami = router({
  exists: publicProcedure
    .input(identifier())
    .output(z.boolean())
    .query(({ input }) => letterExists(input)),
  unlock: publicProcedure
    .input(
      z.object({
        id: identifier(),
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
        id: identifier(),
        access: z.optional(z.string()).nullable(),
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
            valid = fkey === input.access;
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
    .input(identifier())
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
  delete: publicProcedure
    .input(identifier())
    .mutation(async ({ ctx, input }) => {
      if (!isAuthed(ctx.req)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      try {
        await rm(path.join(env.TEGAMI, input), { recursive: true });
      } catch (e) {
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message: `Error creating letter: ${e}`,
        });
      }
    }),
  deleteMedia: publicProcedure
    .input(
      z.object({
        id: identifier(),
        name: fileName(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!isAuthed(ctx.req)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      try {
        await rm(path.join(env.TEGAMI, input.id, input.name));
      } catch (e) {
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message: `Error creating letter: ${e}`,
        });
      }
    }),
  create: publicProcedure.output(identifier()).mutation(async ({ ctx }) => {
    if (!isAuthed(ctx.req)) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const [dir, id] = findPath(env.TEGAMI);
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
        id: identifier(),
        letter: z.string(),
        key: z.string().optional(),
      }),
    )
    .output(z.boolean())
    .mutation(async ({ input, ctx }) => {
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
        await writeFile(path.join(dir, "index.md"), input.letter);
        const keypath = path.join(dir, ".key");
        if (input.key) {
          await writeFile(keypath, input.key);
        } else if (existsSync(keypath)) {
          await rm(keypath);
        }
        return true;
      } catch (e) {
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message: `Failed to save files ${e}`,
        });
      }
    }),
  listMedia: publicProcedure
    .input(identifier())
    .output(z.array(z.object({ name: z.string(), type: z.string() })))
    .query(async ({ ctx, input }) => {
      if (!isAuthed(ctx.req)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const p = path.join(env.TEGAMI, input);
      const dir = await readdir(p);
      return await Promise.all(
        dir
          .filter((v) => !(v === "index.md" || v === ".key"))
          .map(async (v) => {
            const res = await fileTypeFromBuffer(
              await readFile(path.join(p, v)),
            );
            return {
              name: v,
              type: res ? res.mime : "text/plain",
            };
          }),
      );
    }),
  mime: publicProcedure
    .input(
      z.object({
        id: identifier(),
        key: z.string().optional(),
        name: fileName(),
      }),
    )
    .output(z.string())
    .query(async ({ input, ctx }) => {
      try {
        const check = await checkKey(input.id, ctx.req, true);
        if (check && input.key === check.key) {
          const res = await fileTypeFromBuffer(
            await readFile(path.join(env.TEGAMI, input.id, input.name)),
          );
          return res ? res.mime : "text/plain";
        } else {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }
      } catch (e) {
        if (e instanceof TRPCError) throw e;
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message: `Error parsing key for letter ${input.id}`,
        });
      }
    }),
});
