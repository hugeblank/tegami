import { defaultUrlTransform } from "react-markdown";
import EmbeddedMedia from "./EmbeddedMedia";
import { useTRPC } from "~/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import Prose from "./Prose";

export function transform(id: string, key?: string): (url: string) => string {
  return (url: string) =>
    defaultUrlTransform(
      `/media/${id}/${url.replace(/^\.\//, "")}${key ? `?key=${key}` : ""}`,
    );
}

export const components = {
  img: EmbeddedMedia,
};

export default function Letter({
  id,
  access: key,
}: {
  id: string;
  access?: string;
}) {
  const trpc = useTRPC();

  const openLetter = useQuery(trpc.tegami.open.queryOptions({ id, key }));

  if (openLetter.isLoading) {
    return <p>Loading...</p>;
  } else {
    return (
      <Prose urlTransform={transform(id, key)} components={components}>
        {openLetter.data}
      </Prose>
    );
  }
}
