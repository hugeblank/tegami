import { env } from "~/util/env";
import type { Route } from "./+types/media";
import path from "path";
import { readFile } from "fs/promises";
import { fileTypeFromBuffer } from "file-type";

export async function loader({ params }: Route.LoaderArgs) {
  const fullpath = path.join(env.TEGAMI, params.letter, params.file);
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
    throw new Error(`No such file ${params.file}: ${e}`);
  }
}
