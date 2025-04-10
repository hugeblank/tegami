import type { Route } from "./+types/root";
import Letter from "~/components/Letter";
import { useState } from "react";
import Unlock from "~/components/Unlock";
import { useTRPC } from "~/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "手紙" },
    { name: "description", content: "A letter for you! あなたのために手紙！" },
  ];
}

function error(message: string) {
  return (
    <>
      <h2 className="text-2xl text-red-500">{message}</h2>
      <Link to="/admin">Go back</Link>
    </>
  );
}

export default function Root({ params }: Route.ComponentProps) {
  const keyState = useState<string | undefined>();
  const [key] = keyState;
  const trpc = useTRPC();

  const letterExists = useQuery(trpc.tegami.exists.queryOptions(params.letter));

  if (!params.letter.match(/[a-z0-9]{10}/)) {
    return error("Invalid Letter ID");
  } else if (letterExists.isSuccess && !letterExists.data) {
    return error("No such Letter");
  }

  return (
    <main className="container mx-auto flex flex-col items-center p-4 pt-8">
      {key ? (
        <Letter id={params.letter} access={key}></Letter>
      ) : (
        <Unlock id={params.letter} accessState={keyState} />
      )}
    </main>
  );
}
