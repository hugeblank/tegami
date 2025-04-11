import { env } from "~/util/env";

export function isAuthed(request: Request) {
  const auth = request.headers.get("Authorization");
  return (
    auth !== null &&
    auth.split(" ")[1] === Buffer.from(env.AUTH).toString("base64")
  );
}
