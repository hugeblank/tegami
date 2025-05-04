import { isAuthed } from "~/lib/login.server";

export async function createContext({
  req,
  resHeaders,
}: {
  req: Request;
  resHeaders: Headers;
}) {
  return {
    req,
    resHeaders,
    isAuthed: await isAuthed(req),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
