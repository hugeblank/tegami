import Letter from "~/components/Letter";
import type { Route } from "./+types/editor";

export default function Editor({ params }: Route.ComponentProps) {
  return <Letter id={params.letter} />;
}
