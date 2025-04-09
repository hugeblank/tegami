import type { Route } from "./+types/root";
import Letter from "~/components/Letter";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "手紙" },
    { name: "description", content: "A letter for you! あなたのために手紙！" },
  ];
}

export default async function Root({ params }: Route.ComponentProps) {
  return <Letter id={params.letter}></Letter>;
}
