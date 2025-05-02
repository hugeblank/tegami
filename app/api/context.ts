import { isAuthed } from "../lib/login.server";

export async function createContext({ req }: { req: Request }) {
  // As an example, you can retrieve auth or other information here.
  // const user = { name: req.headers.get("username") ?? "anonymous" };

  return {
    req,
    isAuthed: await isAuthed(req),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
