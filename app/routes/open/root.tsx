import type { Route } from "./+types/root";
import { Letter } from "~/components/letter";
import { useState } from "react";
import Unlock from "~/components/unlock";
import { getMetadata, letterExists } from "~/util/misc.server";

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: "手紙" },
    {
      name: "description",
      content: data.title ?? "A letter for you! あなたへの手紙！",
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  if (!letterExists(params.letter))
    throw new Response("Not found", { status: 404 });

  const meta = await getMetadata(params.letter);
  return { title: meta.title };
}

export default function Root({ params }: Route.ComponentProps) {
  const keyState = useState<string>();
  const [doOpen, setOpen] = useState<boolean>(false);
  const [key] = keyState;
  return (
    <main className="container mx-auto flex flex-col items-center p-4 pt-8">
      {doOpen ? (
        <Letter id={params.letter} access={key} />
      ) : (
        <Unlock id={params.letter} accessState={keyState} setOpen={setOpen} />
      )}
    </main>
  );
}
