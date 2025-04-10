import Markdown, { type Options } from "react-markdown";

export default function Prose(
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
