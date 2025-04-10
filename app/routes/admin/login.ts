import { redirect } from "react-router";
import type { Route } from "./+types/login";

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
