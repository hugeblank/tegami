import { type HTMLProps } from "react";
import { useTRPC } from "~/lib/trpc";
import { skipToken, useQuery } from "@tanstack/react-query";
import Media from "./Media";
import Throbber from "./Throbber";

export default function EmbeddedMedia(props: HTMLProps<HTMLImageElement>) {
  const { mime } = useTRPC().tegami;
  const [, , id, garbage] = props.src!.split("/");
  const [name, moregarbage] = garbage.split("?");
  const key = moregarbage ? moregarbage.split("=")[1] : undefined;
  const cont =
    id.match(/[0-9a-f]{10}/) && name.match(/[0-9a-f]{10}\.[0-9a-z]{2,4}/);
  const query = useQuery(
    mime.queryOptions(cont ? { id, name, key } : skipToken),
  );

  if (query.isLoading) {
    return <Throbber />;
  } else if (!query.isSuccess) {
    return `Failed to load media\n${name} ${props.alt ? "(" + props.alt + ")" : ""}`;
  }

  const type = query.data!.split("/")[0];
  return (
    <Media
      src={props.src!}
      mime={query.data}
      alt={props.alt}
      dialog={type === "image"}
    />
  );
}
