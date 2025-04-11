import { existsSync } from "fs";
import path from "path";

export function findPath(prefix: string, suffix?: string): [string, string] {
  while (true) {
    const arr = crypto.getRandomValues(new Uint8Array(5));
    const id = Buffer.from(arr).toString("hex");
    const dir = path.join(prefix, id + (suffix ?? ""));
    if (!existsSync(dir)) return [dir, id];
  }
}
