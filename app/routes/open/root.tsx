import type { Route } from "./+types/root";
import Letter from "~/components/Letter";
import { useState } from "react";
import Unlock from "~/components/Unlock";
import { letterExists } from "~/util/misc";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "手紙" },
    {
      name: "description",
      content: "A letter for you! あなたへの手紙！",
    },
  ];
}

export function loader({ params }: Route.LoaderArgs) {
  if (!letterExists(params.letter))
    throw new Response("Not found", { status: 404 });
}

export default function Root({ params }: Route.ComponentProps) {
  const keyState = useState<string | undefined>();

  return (
    <main className="container mx-auto flex flex-col items-center p-4 pt-8">
      {keyState[0] ? (
        <Letter id={params.letter} access={keyState[0]} />
      ) : (
        <Unlock id={params.letter} accessState={keyState} />
      )}
    </main>
  );
}
