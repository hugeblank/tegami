import { readFile } from "node:fs/promises";
import path from "node:path";
import Markdown, { defaultUrlTransform } from "react-markdown";
import { env } from "~/util/env";
import type { Route } from "./+types/root";
import Image from "~/components/Image";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.png" },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "手紙" },
    { name: "description", content: "A letter for you! あなたのために手紙！" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const fullpath = path.join(env.TEGAMI, params.letter, "index.md");
  try {
    return {
      id: params.letter,
      file: (await readFile(fullpath)).toString(),
    };
  } catch (e) {
    throw new Error(`No such letter ${params.letter}: ${e}`);
  }
}

function transform(id: string): (url: string) => string {
  return (url: string) =>
    defaultUrlTransform(id + "/" + url.replace(/^\.\//, ""));
}

const components = {
  img: Image,
};

export default function Letter({ loaderData }: Route.ComponentProps) {
  return (
    <article className="prose prose-img:rounded-md prose-code:rounded-md dark:prose-invert sm:prose-sm md:prose-md lg:prose-lg xl:prose-xl">
      <Markdown urlTransform={transform(loaderData.id)} components={components}>
        {loaderData.file}
      </Markdown>
    </article>
  );
}
