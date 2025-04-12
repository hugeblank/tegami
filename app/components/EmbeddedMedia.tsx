import { type HTMLProps } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { useTRPC } from "~/lib/trpc";
import { skipToken, useQuery } from "@tanstack/react-query";
import Media from "./Media";

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
    return "Loading...";
  } else if (!query.isSuccess) {
    return `Failed to load media\n${name} ${props.alt ? "(" + props.alt + ")" : ""}`;
  }

  const type = query.data!.split("/")[0];
  if (type === "image") {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <img {...props} />
        </DialogTrigger>
        <DialogContent className="flex h-11/12 w-11/12 flex-col sm:max-w-[unset]">
          <DialogTitle hidden>{props.src}</DialogTitle>
          <DialogDescription>{props.alt}</DialogDescription>
          <img {...props} className="h-full w-full object-scale-down" />
        </DialogContent>
      </Dialog>
    );
  } else {
    return <Media src={props.src!} mime={query.data} alt={props.alt} />;
  }
}
