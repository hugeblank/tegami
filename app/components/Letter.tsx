import { defaultUrlTransform } from "react-markdown";
import ImageDialog from "./ImageDialog";
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
  img: ImageDialog,
};

export default function Letter({
  id,
  access,
}: {
  id: string;
  access?: string;
}) {
  const trpc = useTRPC();

  const openLetter = useQuery(
    trpc.tegami.open.queryOptions({ id, key: access }),
  );

  if (openLetter.isLoading) {
    return <p>Loading...</p>;
  } else {
    return (
      <Prose urlTransform={transform(id, access)} components={components}>
        {openLetter.data}
      </Prose>
    );
  }
}
