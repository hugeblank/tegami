import { Link, redirect } from "react-router";
import type { Route } from "./+types/root";
import { isAuthed } from "./login";
import { readdir } from "fs/promises";
import { env } from "~/util/env";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "手紙 Admin" },
    { name: "description", content: "手紙 Admin dashboard" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  if (!isAuthed(request)) {
    throw redirect("/login");
  }
  return await readdir(env.TEGAMI);
}

export default function Root({ loaderData }: Route.ComponentProps) {
  const links = loaderData.map((name, i) => {
    return (
      <Link
        className="text-xl text-blue-500 underline"
        to={name}
        key={name + i}
      >
        {name}
      </Link>
    );
  });
  return (
    <>
      <h1 className="bold pb-4 text-4xl">Your Letters</h1>
      {links}
    </>
  );
}
