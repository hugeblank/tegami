import { env } from "~/util/env";
import path from "path";
import { readFile } from "fs/promises";
import { fileTypeFromBuffer } from "file-type";
import type { Route } from "./+types/root";
import { existsSync } from "fs";

export async function loader({ params, request }: Route.LoaderArgs) {
  const fullpath = path.join(env.TEGAMI, params.letter, params.file);
  const keypath = path.join(env.TEGAMI, params.letter, ".key");
  if (existsSync(keypath)) {
    try {
      const key = (await readFile(keypath)).toString();
      if (key === new URL(request.url).searchParams.get("key")) {
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
    } catch {
      throw new Response("Failed to read key file", { status: 500 });
    }
  }
}
