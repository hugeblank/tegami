import { redirect } from "react-router";
import type { Route } from "./+types/login";
import { env } from "~/util/env";

export function isAuthed(request: Request) {
  const auth = request.headers.get("Authorization");
  return (
    auth && auth.split(" ")[1] === Buffer.from(env.AUTH).toString("base64")
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  if (!request.headers.has("Authorization")) {
    const response = new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Ninth Circle of Hell"',
      },
    });
    throw response;
  }
  throw redirect("/admin");
}
