import Letter from "~/components/Letter";
import type { Route } from "./+types/editor";

export default function Editor({ params }: Route.ComponentProps) {
  console.log("here");
  return <Letter id={params.letter}></Letter>;
}
