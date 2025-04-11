import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { isAuthed } from "../api/login";
import { env } from "~/util/env";

type KeyCheck = { has: boolean; key?: string };

export async function checkKey(
  id: string,
  request: Request,
): Promise<KeyCheck | undefined> {
  const dir = path.join(env.TEGAMI, id);
  if (existsSync(dir)) {
    const keypath = path.join(dir, ".key");
    if (existsSync(keypath)) {
      const fkey = (await readFile(path.join(dir, ".key"))).toString();
      if (isAuthed(request)) {
        return { has: true, key: fkey };
      } else {
        return { has: true };
      }
    } else {
      return { has: false };
    }
  }
}
