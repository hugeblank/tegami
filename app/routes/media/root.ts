import { env } from "~/util/env";
import path from "path";
import { readFile } from "fs/promises";
import { fileTypeFromBuffer } from "file-type";
import type { Route } from "./+types/root";
import { existsSync } from "fs";
import { isAuthed } from "~/api/login";

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
  if (valid) {
    try {
      const buf = await readFile(fullpath);
      const response = new Response(buf);
      const type = await fileTypeFromBuffer(new Uint8Array(buf));
      response.headers.append(
        "Content-Type",
        type?.mime ?? "application/unknown",
      );
      return response;
    } catch (e) {
      throw new Response(`Failed to read file ${params.file}: ${e}`, {
        status: 500,
      });
    }
  }
  throw new Response("Unauthorized", { status: 401 });
}
