import Markdown, { defaultUrlTransform, type Components } from "react-markdown";
import { EmbeddedMedia } from "./media";
import { useTRPC } from "~/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import Throbber from "./throbber";

function transform(id: string, key?: string): (url: string) => string {
  return (url: string) => {
    if (url.startsWith("./")) {
      return defaultUrlTransform(
        `/media/${id}/${url.replace(/^\.\//, "")}${key ? `?key=${key}` : ""}`,
      );
    } else {
      return defaultUrlTransform(url);
    }
  };
}

const components: Components = {
  img: EmbeddedMedia,
  p: ({ children }) => {
    if (children !== Object(children)) {
      return <p>{children}</p>;
    } else {
      return <div>{children}</div>;
    }
  },
};

export function Letter(props: { id: string; access?: string }) {
  const { open } = useTRPC();

  const openLetter = useQuery(open.queryOptions(props));

  if (openLetter.isLoading) {
    return <Throbber />;
  } else {
    return <Prose {...props}>{openLetter.data}</Prose>;
  }
}
export function Prose(props: {
  id: string;
  access?: string;
  articleClass?: string;
  onArticleChange?: React.FormEventHandler<HTMLElement>;
  children: string | null | undefined;
}) {
  return (
    <article
      onChange={props.onArticleChange}
      className={
        "prose prose-img:rounded-md prose-code:rounded-md dark:prose-invert sm:prose-sm md:prose-md lg:prose-lg xl:prose-xl 2xl:prose-2xl 4xl:prose-4xl " +
        (props.articleClass ? props.articleClass : "")
      }
    >
      <Markdown
        urlTransform={transform(props.id, props.access)}
        components={components}
      >
        {props.children}
      </Markdown>
    </article>
  );
}
