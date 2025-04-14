import Markdown, { defaultUrlTransform, type Options } from "react-markdown";
import { EmbeddedMedia } from "./media";
import { useTRPC } from "~/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import Throbber from "./throbber";

export function transform(id: string, key?: string): (url: string) => string {
  return (url: string) =>
    defaultUrlTransform(
      `/media/${id}/${url.replace(/^\.\//, "")}${key ? `?key=${key}` : ""}`,
    );
}

export const components = {
  img: EmbeddedMedia,
};

export function Letter({ id, access: key }: { id: string; access?: string }) {
  const trpc = useTRPC();

  const openLetter = useQuery(trpc.tegami.open.queryOptions({ id, key }));

  if (openLetter.isLoading) {
    return <Throbber />;
  } else {
    return (
      <Prose urlTransform={transform(id, key)} components={components}>
        {openLetter.data}
      </Prose>
    );
  }
}
export function Prose(
  props: Options & {
    articleClass?: string;
    onArticleChange?: React.FormEventHandler<HTMLElement>;
  },
) {
  return (
    <article
      onChange={props.onArticleChange}
      className={
        "prose prose-img:rounded-md prose-code:rounded-md dark:prose-invert sm:prose-sm md:prose-md lg:prose-lg xl:prose-xl 2xl:prose-2xl 4xl:prose-4xl " +
        (props.articleClass ? props.articleClass : "")
      }
    >
      <Markdown {...props} />
    </article>
  );
}
