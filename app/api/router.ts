import { publicProcedure, router } from "~/api/trpc";
import { TRPCError } from "@trpc/server";
import { fileTypeFromBuffer } from "file-type";
import { existsSync } from "fs";
import { readFile, rm, mkdir, writeFile, readdir, stat } from "fs/promises";
import path from "path";
import { authCookie } from "~/lib/cookies.server";
import { checkAuthorization } from "~/lib/login.server";
import { env } from "~/util/env";
import { letterExists, getMetadata } from "~/util/misc.server";
import { findPath } from "~/util/naming";
import { z } from "zod";

export type AppRouter = typeof appRouter;

export function identifier() {
  return z.string().regex(/[0-9a-f]{10}/);
}
export function fileName() {
  return z.string().regex(/[0-9a-f]{10}\.[0-9a-z]{2,4}/);
}

export const appRouter = router({
  auth: publicProcedure
    .input(z.string())
    .output(z.boolean())
    .query(async ({ input, ctx }) => {
      const authed = checkAuthorization(input);
      if (authed)
        ctx.resHeaders.append("Set-Cookie", await authCookie.serialize(input));
      return authed;
    }),
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
    .query(async ({ input, ctx }) => {
      if (letterExists(input.id)) {
        try {
          const { key } = await getMetadata(input.id);
          return key === input.key || ctx.isAuthed;
        } catch {
          throw new TRPCError({
            code: "UNPROCESSABLE_CONTENT",
            message: `Error parsing metadata for letter ${input.id}`,
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
    .query(async ({ input, ctx }) => {
      if (letterExists(input.id)) {
        try {
          const { key } = await getMetadata(input.id);
          if (key === input.access || ctx.isAuthed) {
            try {
              return (
                await readFile(path.join(env.TEGAMI, input.id, "index.md"))
              ).toString();
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
  getTitles: publicProcedure
    .input(z.array(identifier()))
    .output(z.array(z.string().optional()))
    .query(async ({ input }) => {
      return Promise.all(
        input.map(async (input) => {
          if (letterExists(input)) {
            try {
              return (await getMetadata(input)).title;
            } catch {
              return undefined;
            }
          }
          return undefined;
        }),
      );
    }),
  remove: publicProcedure
    .input(identifier())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.isAuthed) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      try {
        await rm(path.join(env.TEGAMI, input), { recursive: true });
      } catch (e) {
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message: `Error removing letter: ${e}`,
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
      if (!ctx.isAuthed) {
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
    if (!ctx.isAuthed) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const [dir, id] = findPath(env.TEGAMI);
    try {
      await mkdir(dir);
      await writeFile(path.join(dir, "index.md"), "");
      await writeFile(path.join(dir, ".meta.json"), "{}");
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
        title: z.string().optional(),
      }),
    )
    .output(z.boolean())
    .mutation(async ({ input, ctx }) => {
      if (!ctx.isAuthed) {
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
        await writeFile(
          path.join(dir, ".meta.json"),
          JSON.stringify({
            key: input.key,
            title: input.title,
          }),
        );
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
      if (!ctx.isAuthed) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const p = path.join(env.TEGAMI, input);
      const dir = await readdir(p);
      return (
        await Promise.all(
          dir
            .filter((v) => !(v === "index.md" || v.startsWith(".")))
            .map(async (v) => {
              const loc = path.join(p, v);
              const [fstat, res] = await Promise.all([
                stat(loc),
                fileTypeFromBuffer(await readFile(loc)),
              ]);
              return {
                name: v,
                type: res ? res.mime : "text/plain",
                atime: fstat.mtimeMs,
              };
            }),
        )
      ).sort((a, b) => b.atime - a.atime);
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
    .query(async ({ input }) => {
      try {
        const meta = await getMetadata(input.id);
        if (input.key === meta.key || !meta.has) {
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
