import { env } from "~/util/env";
import path from "path";
import { open, readFile, stat } from "fs/promises";
import { fileTypeFromFile } from "file-type";
import type { Route } from "./+types/root";
import { existsSync } from "fs";
import { isAuthed } from "~/api/login";

const CHUNK_SIZE = 10 ** 7;

export async function loader({ params, request }: Route.LoaderArgs) {
  const fullpath = path.join(env.TEGAMI, params.letter, params.file);
  const keypath = path.join(env.TEGAMI, params.letter, ".key");
  let valid = isAuthed(request) || !existsSync(keypath);
  if (!valid) {
    try {
      const key = (await readFile(keypath)).toString();
      valid = key === new URL(request.url).searchParams.get("key");
    } catch {
      throw new Response("Failed to read key file", { status: 500 });
    }
  }
  if (
    params.file === "index.md" ||
    params.file === ".key" ||
    !existsSync(fullpath)
  ) {
    throw new Response("Not found", { status: 404 });
  }
  const mime = await fileTypeFromFile(fullpath);
  if (valid) {
    if (mime) {
      const type = mime.mime.split("/")[0];
      if (type === "video" || type === "audio") {
        const range = request.headers.get("range");
        if (!range) {
          throw new Response("Requires Range header", { status: 400 });
        }
        const videoSize = (await stat(fullpath)).size;
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE, videoSize);
        const contentLength = end - start;
        const headers = {
          "Content-Range": `bytes ${start}-${end}/${videoSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": contentLength.toString(),
          "Content-Type": mime ? mime?.mime : "text/plain",
        };
        let segment;
        try {
          const videoFile = await open(fullpath);
          segment = await videoFile.read({
            buffer: Buffer.alloc(CHUNK_SIZE),
            position: start,
            length: end - start,
          });
          videoFile.close();
        } catch (e) {
          throw new Response(`Failed to handle file ${params.file}: ${e}`, {
            status: 500,
          });
        }
        return new Response(segment.buffer, {
          headers,
          status: 206,
        });
      }
    }
    return new Response(await readFile(fullpath), { status: 200 });
  }
  throw new Response("Unauthorized", { status: 401 });
}
