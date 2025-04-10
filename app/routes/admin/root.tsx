import { Link, redirect, useNavigate } from "react-router";
import type { Route } from "./+types/root";
import { isAuthed } from "~/api/login";
import { readdir } from "fs/promises";
import { env } from "~/util/env";
import { Button } from "~/components/ui/button";
import { useTRPC } from "~/lib/trpc";
import { useMutation } from "@tanstack/react-query";

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
  const createLetter = useMutation(useTRPC().tegami.create.mutationOptions());
  const navigate = useNavigate();
  async function initLetter() {
    navigate("/admin/" + (await createLetter.mutateAsync()));
  }

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
    <main className="container mx-auto flex flex-col items-center p-4 pt-8">
      <Button onClick={initLetter}>Create Letter</Button>
      <h1 className="bold py-4 text-4xl">Your Letters</h1>
      {links}
    </main>
  );
}
