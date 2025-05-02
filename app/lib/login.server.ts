import { env } from "~/util/env";
import { authCookie } from "./cookies.server";

const authorization = btoa(env.AUTH);

export async function isAuthed(request: Request) {
  const cookies = request.headers.get("Cookie");
  const auth = (await authCookie.parse(cookies)) || null;
  return auth !== null && checkAuthorization(auth);
}

export function checkAuthorization(auth: string) {
  return auth === authorization;
}
