import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { isAuthed } from "../lib/login.server";

export async function createContext({
  req,
  resHeaders,
}: FetchCreateContextFnOptions) {
  // As an example, you can retrieve auth or other information here.
  // const user = { name: req.headers.get("username") ?? "anonymous" };

  return {
    req,
    resHeaders,
    isAuthed: await isAuthed(req),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
