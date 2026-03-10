import { env } from "~/util/env";
import path from "path";
import { createReadableStreamFromReadable } from "@react-router/node";
import { readFile, stat } from "fs/promises";
import { fileTypeFromFile } from "file-type";
import type { Route } from "./+types/root";
import { createReadStream, existsSync } from "fs";
import { isAuthed } from "~/lib/login.server";
import { makeContentRangeHeader, parseRange } from "~/lib/range.server";
import { getMetadata, letterExists } from "~/util/misc.server";

export async function loader({ params, request }: Route.LoaderArgs) {
  const fullpath = path.join(env.TEGAMI, params.letter, params.file);

  if (!letterExists(params.letter))
    throw new Response("Not found", { status: 404 });

  if (
    params.file === "index.md" ||
    params.file.startsWith(".") ||
    !existsSync(fullpath)
  ) {
    throw new Response("Not found", { status: 404 });
  }

  if (!(await isAuthed(request))) {
    try {
      const { key } = await getMetadata(params.letter);
      const mime = await fileTypeFromFile(fullpath);
      if (key === new URL(request.url).searchParams.get("key")) {
        if (mime) {
          const type = mime.mime.split("/")[0];
          if (type === "video" || type === "audio") {
            // Stat the file to get its true size (since the DB seems to be wrong about file sizes in a few places)
            const stats = await stat(fullpath);

            // Handle Content-Range (for videos, mainly)
            const range = request.headers.get("range");
            const parsedRange = range
              ? parseRange(range, stats.size)
              : undefined;

            // Stream the file from disk
            // const name = path.basename(fullpath);
            const stream = createReadStream(fullpath, {
              start: parsedRange?.start,
              end: parsedRange?.end,
            });
            const returnedLength = parsedRange
              ? parsedRange.end - parsedRange.start + 1
              : stats.size;

            return new Response(createReadableStreamFromReadable(stream), {
              headers: {
                Date: stats.mtime.toUTCString(),
                "Last-Modified": stats.mtime.toUTCString(),
                // "Content-Disposition": download
                //   ? `attachment; filename="${name}"`
                //   : "inline",
                "Content-Type": mime.mime || "application/octet-stream",
                "Accept-Ranges": "bytes",
                ...(parsedRange
                  ? {
                      "Content-Range": makeContentRangeHeader(
                        parsedRange,
                        stats.size,
                      ),
                    }
                  : {}),
                ...(returnedLength
                  ? { "Content-Length": returnedLength.toString() }
                  : {}),
                "Cache-Control": "private, max-age=2592000, immutable", // 30 days, no shared caches (e.g. Cloudflare)
              },
              status: parsedRange ? 206 : 200,
            });
          }
        }
        return new Response((await readFile(fullpath)).toString("binary"), {
          status: 200,
        });
      }
    } catch {
      throw new Response("Failed to read letter metadata", {
        status: 500,
        headers: { "Content-Type": "application/octet-stream" },
      });
    }
  }

  throw new Response("Unauthorized", { status: 401 });
}
