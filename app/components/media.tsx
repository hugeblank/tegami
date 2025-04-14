import { cn } from "~/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { type HTMLProps } from "react";
import { useTRPC } from "~/lib/trpc";
import { skipToken, useQuery } from "@tanstack/react-query";
import Throbber from "./throbber";

export function Media({
  src,
  alt,
  mime,
  dialog,
  className,
}: {
  src: string;
  alt?: string;
  mime?: string;
  dialog?: boolean;
  className?: string;
}) {
  const type = mime ? mime.split("/")[0] : "image";
  if (type === "video") {
    return (
      <video controls>
        <source src={src} type={mime} className={className} />
      </video>
    );
  } else if (type === "audio") {
    return (
      <audio controls>
        <source src={src} type={mime} className={className} />
      </audio>
    );
  }
  if (dialog) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <img src={src} alt={alt} className={className} />
        </DialogTrigger>
        <DialogContent
          className={"flex h-11/12 w-11/12 flex-col sm:max-w-[unset]"}
        >
          <DialogTitle hidden>{src}</DialogTitle>
          {alt && <DialogDescription>{alt}</DialogDescription>}
          <img
            src={src}
            alt={alt}
            className={cn("h-full w-full object-scale-down", className)}
          />
        </DialogContent>
      </Dialog>
    );
  }
  return <img src={src} alt={alt} className={className} />;
}

export function EmbeddedMedia(props: HTMLProps<HTMLImageElement>) {
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
