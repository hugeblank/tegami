import Markdown, { defaultUrlTransform } from "react-markdown";
import Image from "./Image";
import { useTRPC } from "~/lib/trpc";
import { useMutation } from "@tanstack/react-query";

function transform(id: string, key: string): (url: string) => string {
  return (url: string) =>
    defaultUrlTransform(`/media/${id}/${url.replace(/^\.\//, "")}?key=${key}`);
}

const components = {
  img: Image,
};

export default async function Letter({ id }: { id: string }) {
  if (!id.match(/[a-z0-9]{10}/)) throw new Error("Invalid letter identifier");
  const trpc = useTRPC();
  const key = localStorage.getItem("id");
  const openLetter = useMutation(trpc.tegami.open.mutationOptions());
  if (!key) {
    return <p>NO!</p>;
  }
  const media = await openLetter.mutateAsync({ id, key });
  return (
    <article className="prose prose-img:rounded-md prose-code:rounded-md dark:prose-invert sm:prose-sm md:prose-md lg:prose-lg xl:prose-xl">
      <Markdown urlTransform={transform(id, key)} components={components}>
        {media}
      </Markdown>
    </article>
  );
}
